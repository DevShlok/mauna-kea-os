import { inngest } from "./client";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { candidates, candidateFiles } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { extractTextFromPdf, extractEntitiesFromText } from "../parser";
import { evaluateCandidateMatch } from "@/utils/fuzzy-match";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS to allow backend uploads
);

export const processGdriveCv = inngest.createFunction(
  { id: "process-gdrive-cv", name: "Process Google Drive CV" },
  { event: "cv.process_gdrive_link" },
  async ({ event, step }) => {
    const { candidateId, gdriveUrl } = event.data;
    
    // Step 1: Download CV from GDrive
    const fileIdMatch = gdriveUrl.match(/[-\w]{25,}/);
    if (!fileIdMatch) {
      throw new Error(`Could not extract file ID from GDrive URL: ${gdriveUrl}`);
    }
    const fileId = fileIdMatch[0];
    
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download GDrive file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Step 2: Upload to Supabase Storage
    const fileName = `${candidateId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-cvs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('candidate-cvs')
      .getPublicUrl(fileName);
      
    const publicUrl = publicUrlData.publicUrl;
    
    // Step 3: Parse CV Text
    const extractedText = await extractTextFromPdf(buffer);
    const parsedData = await extractEntitiesFromText(extractedText);
    
    // Step 4: Fuzzy Match & DB Assignment
    const allCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, false));
    const currentCand = allCandidates.find(c => c.id === candidateId);
    
    if (!currentCand) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    // Attempt to find a duplicate based on PARSED data, excluding the current candidate
    let duplicateId: string | null = null;
    let mergedName = currentCand.name;
    let mergedEmail = currentCand.email;
    let mergedMobile = currentCand.mobile;

    // We only try to fuzzy match if we actually extracted meaningful data
    if (parsedData.names.length > 0 || parsedData.primaryEmail || parsedData.primaryPhone) {
      const incoming = {
        name: parsedData.names[0] || currentCand.name,
        email: parsedData.primaryEmail || currentCand.email,
        mobile: parsedData.primaryPhone || currentCand.mobile,
        company: parsedData.companies[0] || currentCand.company
      };
      
      for (const existing of allCandidates) {
        if (existing.id === candidateId) continue;
        
        const { isDuplicate } = evaluateCandidateMatch(incoming, existing);
        if (isDuplicate) {
          duplicateId = existing.id;
          break;
        }
      }

      mergedName = incoming.name;
      mergedEmail = incoming.email;
      mergedMobile = incoming.mobile;
    }
    
    if (duplicateId) {
      // It's a duplicate of an ALREADY EXISTING candidate!
      // 1. Assign the CV to the existing candidate
      await db.insert(candidateFiles).values({
        candId: duplicateId,
        fileType: "CV / Resume",
        fileName: fileName,
        fileUrl: publicUrl,
        extractedText: extractedText
      });
      
      await db.update(candidates)
        .set({ hasCv: true, cvText: extractedText })
        .where(eq(candidates.id, duplicateId));
        
      // 2. Mark the temporary candidate (candidateId) as deleted/placeholder
      await db.update(candidates)
        .set({ isDeleted: true })
        .where(eq(candidates.id, candidateId));
        
      return { success: true, action: "merged", targetCandId: duplicateId };
    } else {
      // It's a truly new candidate. 
      // 1. Save CV
      await db.insert(candidateFiles).values({
        candId: candidateId,
        fileType: "CV / Resume",
        fileName: fileName,
        fileUrl: publicUrl,
        extractedText: extractedText
      });
      
      // 2. Update their profile with the extracted info if they were missing it
      const initials = mergedName && mergedName !== "Unknown" 
        ? mergedName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() 
        : currentCand.initials;
        
      await db.update(candidates)
        .set({
          hasCv: true,
          cvText: extractedText,
          name: currentCand.name === "Unknown" ? mergedName : currentCand.name,
          email: currentCand.email ? currentCand.email : (mergedEmail || ""),
          mobile: currentCand.mobile ? currentCand.mobile : (mergedMobile || ""),
          initials
        })
        .where(eq(candidates.id, candidateId));
        
      return { success: true, action: "updated", targetCandId: candidateId };
    }
  }
);

export const processDirectUploadCv = inngest.createFunction(
  { id: "process-direct-upload-cv", name: "Process Direct CV Upload" },
  { event: "cv.process_direct_upload" },
  async ({ event, step }) => {
    const { publicUrl, fileName } = event.data;
    
    // Step 1: Download the PDF from the public URL
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CV from Supabase: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Step 2: Parse CV Text
    const extractedText = await extractTextFromPdf(buffer);
    const parsedData = await extractEntitiesFromText(extractedText);
    
    // Step 3: Fuzzy Match
    const allCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, false));
    
    let duplicateId: string | null = null;
    
    // Use extracted data
    const incoming = {
      name: parsedData.names[0] || "Unknown",
      email: parsedData.primaryEmail || "",
      mobile: parsedData.primaryPhone || "",
      company: parsedData.companies[0] || ""
    };
    
    if (parsedData.names.length > 0 || parsedData.primaryEmail || parsedData.primaryPhone) {
      for (const existing of allCandidates) {
        const { isDuplicate } = evaluateCandidateMatch(incoming, existing);
        if (isDuplicate) {
          duplicateId = existing.id;
          break;
        }
      }
    }
    
    if (duplicateId) {
      // Duplicate found, attach to existing profile
      await db.insert(candidateFiles).values({
        candId: duplicateId,
        fileType: "CV / Resume",
        fileName: fileName,
        fileUrl: publicUrl,
        extractedText: extractedText
      });
      
      await db.update(candidates)
        .set({ hasCv: true, cvText: extractedText })
        .where(eq(candidates.id, duplicateId));
        
      return { success: true, action: "merged", targetCandId: duplicateId };
    } else {
      // Completely new candidate
      const newId = `CAND-${crypto.randomUUID()}`;
      let initials = "";
      if (incoming.name && incoming.name !== "Unknown") {
        initials = incoming.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      }
      
      await db.insert(candidates).values({
        id: newId,
        name: incoming.name,
        email: incoming.email,
        mobile: incoming.mobile,
        company: incoming.company,
        initials: initials,
        status: "Active",
        hasCv: true,
        cvText: extractedText
      });
      
      await db.insert(candidateFiles).values({
        candId: newId,
        fileType: "CV / Resume",
        fileName: fileName,
        fileUrl: publicUrl,
        extractedText: extractedText
      });
      
      return { success: true, action: "inserted", targetCandId: newId };
    }
  }
);
