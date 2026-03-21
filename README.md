# Fakhri IT Services Platform 

Official web platform for Fakhri IT Services, a premier agency dedicated to empowering Amazon sellers with expert account management, advertising strategies, and growth solutions. This is a comprehensive, full-stack web application built using Next.js, Tailwind CSS, and MongoDB. . .

## 🚀 Key Features   

*   **Public Facing Website**: A modern, responsive, and SEO-optimized public website showcasing services, pricing plans, blog posts, and company information.
*   **Multi-Role Authentication**: Secure login system using NextAuth with support for Google OAuth and Credentials, handling three distinct user roles: `client`, `admin`, and `super-admin`..
*   **Client Dashboard**: A dedicated portal for clients to view their active plans, track task progress, access invoices, and communicate with their account managers.
*   **Admin & Super-Admin Dashboard**: Comprehensive management tools for internal teams to seamlessly handle client accounts, assign tasks, manage billing, and track team performance..
*   **Task Management Workflow**: Robust internal task tracking system with real-time updates and activity logging.
*   **Analytics Integration**: Fully integrated with Google Analytics 4 (GA4) for comprehensive traffic and user behavior tracking.
*   **Database Management**: Includes tailored scripts for migrating and seeding public data securely.
 
## 🛠️ Tech Stack 
 
*   **Frontend**: Next.js 15 (App Router), React  19
*   **Styling**: Tailwind CSS v4, Radix UI Components, Framer Motion
*   **Backend**: Next.js API Routes, Node.js
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: NextAuth.js (v4)
*   **File Storage**: Vercel Blob
*   **Payments**: Razorpay Integration
*   **Analytics**: Google Analytics 4 (@next/third-parties/google)

## 📦 Getting Started

Follow these steps to set up the project locally.
 
### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm, yarn, or pnpm
*   A MongoDB Cluster (Atlas recommended)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/fakhripinnacleconsulting-ship-it/fakhri.git
    cd fakhri
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**

    Create a `.env.local` file in the root directory based on the provided configuration. You will need to supply your own MongoDB URI, Vercel Blob token, NextAuth secrets, Google OAuth credentials, and Google Analytics 4 Measurement ID.

4.  **Database Seeding (Optional but recommended for initial setup):**

    If you are setting up a fresh database, you can seed the public website data using the included script:

    ```bash
    node scripts/seed-public.mjs
    ```

5.  **Run the development server:**

    ```bash
    npm run dev
    ```

6.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 📜 Available Scripts

*   `npm run dev`: Starts the Next.js development server.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run start`: Runs the compiled production server.
*   `npm run lint`: Runs ESLint to identify and fix code issues.
*   `node scripts/seed-public.mjs`: Seeds the MongoDB database with initial public website data.
*   `node scripts/migrate-public-data.mjs`: Migrates public website data from an existing database to a new target database.

## 📂 Project Structure

```
├── app/                  # Next.js App Router endpoints (api/, admin/, client/, public routes)
├── components/           # Reusable React UI components
├── data/                 # Static fallback data and seeding sources
├── lib/                  # Utility functions, database connections, and shared logic
├── models/               # Mongoose database schemas
├── public/               # Static assets (images, icons)
├── scripts/              # Database seeding and migration scripts
└── styles/               # Global CSS styles
```

## 📄 License

This project is proprietary to Fakhri IT Services. Unauthorized copying, modification, or distribution is strictly prohibited.
