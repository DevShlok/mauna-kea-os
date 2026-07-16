const fs = require("fs");
let content = fs.readFileSync("src/app/page.tsx", "utf8");

// Add import for submitContactForm
if (!content.includes("submitContactForm")) {
  content = content.replace('import toast from "react-hot-toast";', 'import toast from "react-hot-toast";\nimport { submitContactForm } from "@/actions/contact";');
}

const oldSubmit = `  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone.match(/^\d{10}$/)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 1500));
    toast.success("Thank you for reaching out. Our specialists will connect with you shortly!");
    setIsSubmitting(false);
    setSupportType(""); setName(""); setCompany(""); setPosition("");
    setEmail(""); setPhone(""); setDescription(""); setAttachment(null);
    setShowForm(false);
  };`;

const newSubmit = `  const handleFormSubmit = async (e: React.FormEvent) => {
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
    
    const formData = new FormData();
    formData.append("supportType", supportType);
    formData.append("name", name);
    formData.append("company", company);
    formData.append("position", position);
    formData.append("email", email);
    formData.append("countryCode", countryCode);
    formData.append("phone", phone);
    formData.append("description", description);
    if (attachment) {
      formData.append("attachment", attachment);
    }
    
    const result = await submitContactForm(formData);
    
    if (result.success) {
      toast.success("Thank you for reaching out. Our specialists will connect with you shortly!");
      setSupportType(""); setName(""); setCompany(""); setPosition("");
      setEmail(""); setPhone(""); setDescription(""); setAttachment(null);
      setShowForm(false);
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
    }
    
    setIsSubmitting(false);
  };`;

content = content.replace(oldSubmit, newSubmit);
fs.writeFileSync("src/app/page.tsx", content);
console.log("Replaced handleFormSubmit in page.tsx");
