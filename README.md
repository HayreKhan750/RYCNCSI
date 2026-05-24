# 🎓 AcademicPulse

### AI-Powered Instructor Rating & Academic Intelligence Platform

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://academicpulse.vercel.app)
[![Firebase Backend](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

**AcademicPulse** (formerly AcademicPulse) is a "billion-dollar" enterprise-grade academic feedback ecosystem. It moves beyond static surveys into a real-time, data-driven performance analytics platform, leveraging AI to bridge the gap between students, faculty, and university management.

---

## 🚀 Architectural Evolution: v1 vs v2

This repository represents the **v2.0 Evolution** of our academic intelligence infrastructure.

| Feature | v1 (Monolith) | v2 (AcademicPulse) |
| :--- | :--- | :--- |
| **Architecture** | Simple CRUD | Serverless Service-Oriented (SSOA) |
| **State Management** | Local State / Prop Drilling | Redux Toolkit (Memoized Selectors) |
| **AI Integration** | None | Real-time Sentiment & Toxicity Analysis |
| **Security** | Basic Auth | 4-Tier RBAC + Firestore Security Rules |
| **Performance** | Standard Lists | Virtualized Lists + Atomic Transactions |
| **Analytics** | Static Tables | Predictive Analytics + Executive PDF Reports |

---

## 🔥 Key Features

### 🧠 AI-Driven Insights
- **Sentiment Analysis**: Automated scoring of every review to track instructor performance trends.
- **Toxicity Detection**: Instant flagging of offensive content via serverless Cloud Functions.
- **Pedagogical Tagging**: AI extracts teaching styles (e.g., "Inspirational", "Tough Grader") for better discoverability.

### 🛡️ Enterprise-Grade Security
- **4-Tier RBAC**: Specialized portals for **Students**, **Instructors**, **Management**, and **Admins**.
- **Defense-in-Depth**: Multi-layered security enforced at the application, service, and database levels.
- **Immutable Audit Logs**: Traceable history of all administrative actions.

### ⚡ High-Performance Engine
- **Atomic Transactions**: Race-condition prevention for concurrent rating submissions.
- **List Virtualization**: Silky-smooth performance even with thousands of reviews.
- **Optimistic UI**: Zero-latency feedback loop for user interactions (Likes/Dislikes/Ratings).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Redux Toolkit, Framer Motion, Tailwind CSS, Lucide Icons.
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Hosting, Storage).
- **AI/ML**: Natural Language Processing (Sentiment/Toxicity) via Cloud Functions.
- **Reporting**: jsPDF, AutoTable for executive-grade PDF generation.

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Firebase Project

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/HayreKhan750/academic-pulse.git
   cd academic-pulse
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_ID=your_messaging_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
4. Start the development server:
   ```bash
   npm start
   ```

---

## 📈 Portfolio Highlights (CV-Ready)

**AcademicPulse — AI-Powered Instructor Rating Platform**
- Built a full-stack academic feedback ecosystem serving Students, Instructors, Management, and Admins with strict RBAC enforced via Firestore Rules.
- Engineered an AI pipeline via Firebase Cloud Functions for automated sentiment scoring, toxicity detection, and pedagogical tag extraction.
- Implemented atomic transactions and deterministic document IDs to prevent race conditions in concurrent rating submissions.
- Designed a denormalized Firestore schema with composite indexes for O(log N) query performance and list virtualization for DOM efficiency.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for the future of education.*
