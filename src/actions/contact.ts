"use server";

import { uploadToDrive, appendRowToSheet } from "@/lib/google";
import { Resend } from "resend";

export async function submitContactForm(formData: FormData) {
  try {
    const supportType = formData.get("supportType") as string;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const position = formData.get("position") as string;
    const email = formData.get("email") as string;
    const countryCode = formData.get("countryCode") as string;
    const phone = formData.get("phone") as string;
    const description = formData.get("description") as string;
    const attachment = formData.get("attachment") as File | null;

    let driveLink = "";
    let emailAttachments: any[] = [];

    // Process attachment if provided
    if (attachment && attachment.size > 0) {
      // Upload to Google Drive
      driveLink = await uploadToDrive(attachment);

      // Prepare for Resend
      const buffer = Buffer.from(await attachment.arrayBuffer());
      emailAttachments.push({
        filename: attachment.name,
        content: buffer,
      });
    }

    // Prepare Sheets Row
    const dateStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
    const timeStr = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" });
    const fullPhone = `${countryCode} ${phone}`;

    const rowData = [
      `${dateStr} ${timeStr}`,
      name,
      company,
      position,
      email,
      countryCode,
      phone,
      driveLink,
      description,
    ];

    // Determine Sheet Tab
    // Users requirement:
    // "I want to expand my team / I need advisory services" -> Form filled by Client
    // "I am looking for a career change" -> Form filled by Candidate
    let sheetTab = "Form filled by Client";
    if (supportType.toLowerCase().includes("career change")) {
      sheetTab = "Form filled by Candidate";
    }

    // Write to Google Sheets
    await appendRowToSheet(sheetTab, rowData);

    // Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailBody = `
New Website Enquiry: ${supportType}

Name: ${name}
Company: ${company}
Position: ${position}
Email: ${email}
Phone: ${fullPhone}
Description: ${description}

Attached File: ${driveLink ? driveLink : "No file attached"}
      `;

      await resend.emails.send({
        from: "Mauna Kea Website <info@maunakea.co.in>",
        to: "recruitment@maunakea.co.in",
        replyTo: email,
        subject: `New Website Enquiry: ${supportType} - ${name} - ${company}`,
        text: emailBody,
        attachments: emailAttachments,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting contact form:", error);
    return { success: false, error: error.message || "Failed to submit form" };
  }
}
