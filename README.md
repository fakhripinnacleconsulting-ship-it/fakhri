# Fakhri IT Services Platform

Official web platform for **Fakhri IT Services**, a premier agency dedicated to empowering Amazon sellers with expert account management, advertising strategies, and growth solutions. This is a comprehensive, full-stack enterprise application built using the latest Next.js 15+ ecosystem.

---

## 🚀 Platform Overview

Fakhri IT Services is architected as a definitive digital ecosystem for e-commerce professionals. The platform follows a **"Security-First, Speed-Always"** philosophy, providing a seamless bridge between complex data operations and user-centric business management.

### 💎 Key Features

*   **Public Facing Website**: A modern, responsive, and SEO-optimized public website showcasing services, pricing plans, blog posts, and company information.
*   **Multi-Role Authentication**: Secure system using NextAuth.js with support for Google OAuth and Credentials, handling three distinct user roles: `client`, `admin`, and `super-admin`.
*   **Dynamic Client Portal**: A dedicated workspace for clients to track task progress in real-time, access invoices, and manage active plans.
*   **Admin & Super-Admin Command Centers**: Industrial-grade dashboards for internal teams to handle client accounts, assign tasks via Kanban workflows, manage billing, and track platform performance.
*   **Task Management Workflow**: Robust internal task tracking system with automated activity logging and state transitions (Pending → In Progress → Review → Completed).
*   **Integrated Analytics**: Deep platform intelligence powered by Google Analytics 4 (GA4) with custom dashboard visualizations using Recharts.

---

## 🛠️ State-of-the-Art Tech Stack

*   **Core**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Framer Motion
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: NextAuth.js (v4)
*   **Cloud Infrastructure**: Vercel Blob (Storage), Razorpay (Payments)
*   **Analytics**: Google Analytics 4 (@next/third-parties)

---

## 📦 Getting Started

### Prerequisites

*   Node.js (v20+ recommended)
*   npm, yarn, or pnpm
*   A MongoDB Cluster (Atlas recommended)

### Installation & Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kuldeepmaurya4296/fakhri-outh-test.git
    cd fakhri-outh-test
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env.local` file in the root directory. You will need to provide:
    *   `MONGODB_URI`
    *   `NEXTAUTH_SECRET` & `NEXTAUTH_URL`
    *   `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
    *   `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`

4.  **Database Seeding (Initial Setup):**
    Seed initial public website data:
    ```bash
    node scripts/seed-public.mjs
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Security & Performance

*   **RBAC (Role Based Access Control)**: Implemented via unified middleware for secure route protection.
*   **JWT Integrity**: 256-bit signed tokens stored in HTTP-only cookies to prevent XSS.
*   **Stateless Scaling**: Optimized for thousands of concurrent users with zero session storage overhead.
*   **Media Optimization**: Automated cloud buffer system for lightning-fast asset delivery.

---

## 📂 Project Roadmap

```bash
├── app/                  # Next.js App Router (Admin, Client, API, Public routes)
├── components/           # Shaden/Radix UI Component Library
├── context/              # Global State (Auth, UI, Theme)
├── lib/                  # Shared Business Logic & Database Connectors
├── models/               # Mongoose Data Schemas
├── scripts/              # Migration, Seeding & Maintenance Utilities
└── public/               # Static High-Resolution Assets
```

## 📄 License

This project is proprietary to **Fakhri IT Services**. Unauthorized copying, modification, or distribution is strictly prohibited.
