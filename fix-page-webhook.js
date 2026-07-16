const fs = require("fs");
let content = fs.readFileSync("src/app/page.tsx", "utf8");

// Remove the import
content = content.replace('import { submitContactForm } from "@/actions/contact";\n', '');

const oldHandleFormSubmitRegex = /  const handleFormSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?    setIsSubmitting\(false\);\n  \};/;

const newHandleFormSubmit = `  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone.match(/^\\d{10}$/)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL;
      if (!webhookUrl) throw new Error("Webhook URL is not configured.");

      // Base64 encode the attachment if exists
      let fileBase64 = "";
      let fileName = "";
      let mimeType = "";

      if (attachment) {
        fileName = attachment.name;
        mimeType = attachment.type || "application/octet-stream";
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(attachment);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove the data URI prefix
          };
          reader.onerror = (error) => reject(error);
        });
      }

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

      const response = await fetch(webhookUrl, {
        method: "POST",
        // mode: "no-cors", // Sometimes GAS requires no-cors, but no-cors makes response opaque. Let's try standard cors first.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      // We will parse JSON if possible. If CORS blocks reading response, we assume success.
      // But standard POST to GAS published as "execute as me" usually works with text/plain. 
      // Actually, GAS requires Content-Type: text/plain for CORS to work natively without preflight.
      // So we must stringify and send as text/plain!
      
    } catch (err: any) {} // temporary placeholder to let me rethink the exact GAS fetch logic
`;

// Wait, doing this via script is getting complex with string building. 
// I will just write a cleaner node script to replace it.
