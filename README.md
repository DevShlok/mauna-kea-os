# Mauna Kea OS — Internal Platform

Welcome to **Mauna Kea OS**, a next-generation Executive Search, ATS, and AI Assessment platform built specifically for high-growth strategic hiring.

This platform unifies mandate management, candidate pipelining, float list management, team timesheets, and AI-driven candidate assessment into a single, seamless dashboard.

## 🏗 Architecture & Tech Stack

Mauna Kea OS is built on a **Feature-Driven Architecture** using the absolute modern standard for Next.js applications.

### Core Stack
- **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Lucide Icons

### Database & Auth
- **Database**: [Aiven MySQL](https://aiven.io/) (Cloud Database)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)
- **Authentication**: [Clerk](https://clerk.com/)

### AI & Integrations
- **AI Engine**: Google Gemini API (`@ai-sdk/google`)
- **Web Scraping**: Apify Client (for automated LinkedIn profile processing)
- **File Syncing**: Custom Google Apps Script Webhooks (Auto-syncs data and CVs to Google Drive & Google Sheets)

### Document Processing Suite
- **PDF Extraction**: `pdf-parse-new`
- **Docx Extraction**: `mammoth`
- **PDF Report Generation**: `jspdf` & `html2canvas-pro`
- **Excel Exporting**: `exceljs` & `xlsx`

---

## 🚀 Local Development Setup

Follow these steps to get the project running locally on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/DevShlok/mauna-kea-os.git
cd mauna-kea-os
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root of the project. You will need to provide all of your API keys and connection strings.

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL="mysql://user:pass@host:port/defaultdb?ssl={\"rejectUnauthorized\":true}"

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"

# Google Webhooks (Apps Script)
OS_DRIVE_WEBHOOK_URL="your_drive_webhook_url"
OS_SHEETS_WEBHOOK_URL="your_sheets_webhook_url"

# Apify
APIFY_API_TOKEN="your_apify_api_key"
```

### 4. Database Setup
We use Drizzle ORM to manage the database schema. Ensure your `DATABASE_URL` is correct.

Push the latest schema to your database:
```bash
npx drizzle-kit push
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

---

## 📂 Project Structure

This project follows a strict **Feature-Sliced Design**.
- `src/app/` - Next.js App Router (Page routing only).
- `src/actions/` - Server Actions (Database mutations).
- `src/features/` - Core business logic encapsulated by feature (e.g., `/candidates`, `/mandates`, `/admin`). Contains feature-specific components.
- `src/components/` - Generic, reusable UI components (Buttons, Topbar, Sidebar).
- `src/db/` - Database schema and connection configuration.
- `src/middleware.ts` - Edge authentication route protection (Clerk).
- `public/` - Static assets and optimized images.

---

## ☁️ Deployment

Mauna Kea OS is optimized for **Vercel**. 
All local file uploading (CVs, PDFs) has been explicitly bypassed in favor of in-memory Buffer parsing and Google Drive Webhook streaming, meaning this application is **100% Serverless-Compatible**.

Simply connect this repository to Vercel, copy your `.env.local` variables into Vercel's Environment Variables settings, and hit Deploy.

## License
Proprietary — Mauna Kea International
