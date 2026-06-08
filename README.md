# Mauna Kea OS — Internal Platform

Welcome to **Mauna Kea OS**, a next-generation Executive Search and AI Assessment platform built for high-growth strategic hiring. 

This platform unifies mandate management, candidate pipelining, float list management, and AI-driven candidate assessment into a single, seamless dashboard.

## Tech Stack

This project is built using modern, highly scalable web technologies:
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MySQL](https://www.mysql.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [MySQL](https://www.mysql.com/) (Ensure the service is running)

## Local Development Setup

Follow these steps to get the project running locally on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/mauna-kea-os.git
cd mauna-kea-os
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root of the project. You will need to provide your MySQL database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=maunakea
DB_PORT=3306

# (Optional) Future AI configuration
# OPENAI_API_KEY=your_openai_api_key
```

### 4. Database Setup
We use Drizzle ORM to manage the database schema. Ensure your MySQL server is running, and an empty database named `maunakea` exists.

First, push the schema to your database:
```bash
npx drizzle-kit push
```

*(Optional)* If you have a seed script to populate initial mock data:
```bash
npm run seed
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## Features & Architecture

- **Mandates Dashboard**: Track active executive search mandates, manage pipelines (Longlist -> Offer), and visualise the hiring funnel.
- **Float List**: A centralised repository of active "A-player" candidates proactively mapped to dream roles and companies.
- **AI Workbench (In Progress)**: Evaluates candidate transcripts against specific competency frameworks (e.g., CFO, CTO) to generate structured, PDF-ready assessment reports.
- **Responsive UI**: A highly responsive, premium UI utilising glassmorphism and modern dashboard aesthetics.

## Contributing
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License
Proprietary — Mauna Kea International
