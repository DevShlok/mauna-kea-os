"use server";

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

    let fileBase64 = "";
    let fileName = "";
    let mimeType = "";
    let emailAttachments: any[] = [];

    // Process attachment if provided
    if (attachment && attachment.size > 0) {
      fileName = attachment.name;
      mimeType = attachment.type || "application/octet-stream";
      
      const buffer = Buffer.from(await attachment.arrayBuffer());
      fileBase64 = buffer.toString('base64');
      
      // Prepare for Resend
      emailAttachments.push({
        filename: attachment.name,
        content: buffer,
      });
    }

    // 1. Send to Google Apps Script Webhook (for Drive and Sheets)
    const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("Webhook URL is not configured in .env.local");

    const payload = {
      supportType,
      name,
      company,
      position,
      email,
      countryCode,
      phone,
      description,
      fileName,
      mimeType,
      fileBase64
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // GAS prefers text/plain to avoid preflight
      body: JSON.stringify(payload)
    });

    const webhookResult = await webhookResponse.json();
    if (webhookResult.status !== "success") {
      throw new Error(webhookResult.message || "Failed to log data to Google Sheets.");
    }

    const driveLink = webhookResult.fileUrl || "";

    // 2. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fullPhone = `${countryCode} ${phone}`;
      
      const emailBody = `
New Website Enquiry: ${supportType}

Name: ${name}
Company: ${company}
Position: ${position}
Email: ${email}
Phone: ${fullPhone}
Description: ${description}

Drive Link: ${driveLink ? driveLink : "No file attached"}
      `;

      await resend.emails.send({
        from: "Mauna Kea Website <info@maunakea.co.in>",
        to: "recruitment@maunakea.co.in",
        replyTo: email,
        subject: `New Website Enquiry: ${supportType} - ${name} - ${company}`,
        text: emailBody,
        attachments: emailAttachments,
      });
    } else {
      console.warn("RESEND_API_KEY is missing. Email was not sent, but Google Sheets was updated.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting contact form:", error);
    return { success: false, error: error.message || "Failed to submit form" };
  }
}
