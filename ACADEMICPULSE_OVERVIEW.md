# AcademicPulse - System Overview & Architecture Guide

## 1. Introduction
**AcademicPulse** is a modern, enterprise-grade web application designed to facilitate feedback and engagement between students and instructors. It provides a premium, data-driven platform for rating instructors, analyzing teaching performance, and managing academic interactions.

## 2. Technology Stack

### Frontend
*   **Framework**: React.js (v19.x) - Utilizing latest concurrent features.
*   **State Management**: Redux Toolkit (Slices: Auth, User, Instructor, Feedback, Admin, Theme, Navigation).
*   **Routing**: React Router v6.28+ (Protected Routes, Role-based Access).
*   **UI/UX**: 
    *   **Styling**: Tailwind CSS / Vanilla CSS with "Premium Modern" Design System.
    *   **Animations**: Framer Motion (v12+) for sophisticated layout transitions.
    *   **Icons**: Lucide React.
    *   **Notifications**: React Toastify.
*   **Build Tool**: Webpack (via React Scripts).

### Backend (Serverless)
*   **Platform**: Firebase
*   **Database**: Cloud Firestore (NoSQL)
*   **Authentication**: Firebase Auth (Email/Password, Google Sign-In)
*   **Storage**: Cloudinary (Primary for optimized profile/asset storage).
*   **Services Layer**: Modular JavaScript services (`src/services/`) wrapping Firebase logic.

## 3. User Roles & Access Control

The system supports three distinct user roles, enforced via `authService` and Firestore:

1.  **Student**: The default role. Can rate instructors, view profiles, manage their own profile, and participate in community feedback.
2.  **Instructor**: Can view personal analytics, reply to reviews, manage course details, and customize their public profile.
3.  **Admin**: Full enterprise access. Can manage users (ban/approve), audit system actions, import data, and view high-level analytics.

## 4. Core Features & Functionality

### A. Authentication & Security
*   **Secure Access**: Email/Password and Google OAuth providers.
*   **Role-Based Security**: dedicated `ProtectedRoute` and `AdminRoute` wrappers.
*   **Session Persistence**: Automatic state rehydration on app launch.

### B. Student Module
*   **Dashboard**: Personalized engagement tracking, "Top Instructors" discovery widget, and "Top Reviewers" leaderboard.
*   **Rating System**: 
    *   Multi-faceted rating (Overall + Tags like "Inspirational", "Tough Grader").
    *   Anonymous rating support.
    *   **AI Insights**: Automated sentiment analysis on submitted feedback.
*   **Social Features**: Ability to "Like" or "Dislike" other reviews (`reactionCount`).

### C. Instructor Module
*   **Analytics Dashboard**: 
    *   Real-time metrics: Average Rating, Total Reviews, Engagement Score.
    *   Visual trend analysis and sentiment summaries.
*   **Reputation Management**: Tools to read and reply to student feedback.
*   **Profile Management**: Update bio, extensive contact info, and profile visuals.

### D. Admin Module
*   **Enterprise Dashboard**: High-level stats on system health (Total Users, Ratings, Flagged Content).
*   **User Management**: Ban/Suspend/Restrict users with detailed reasoning and audit trails.
*   **Content Moderation**: 
    *   **Reports System**: Queue for handling flagged content (`reports` collection).
    *   **Audit Logging**: Comprehensive tracking of all admin actions (`audit_logs` collection).
*   **Data Tools**: Bulk import for instructor/course data (`my-file.optimized.json`).

## 5. Data Architecture (Firestore)

The database is structured for scalability and quick reads:

*   **`users`**: Core user profiles (Students & Admin).
    *   Fields: `uid`, `email`, `displayName`, `role`, `department`, `stats` (reviewsCount, helpfulCount).
*   **`instructors`**: Dedicated profiles for instructors (linked to `users` via `userId` or standalone).
    *   Fields: `instructorName`, `department`, `avgRating`, `ratingCount`, `courses` (Array).
*   **`feedbacks`**: Stores individual ratings.
    *   Fields: `instructorId`, `studentId`, `rating`, `text`, `tags`, `aiScore` (toxicity/sentiment), `flagStatus`.
*   **`replies`**: Instructor responses (typically top-level or sub-collection).
*   **`audit_logs`**: Immutable record of system actions.
    *   Fields: `actorId`, `action` (e.g., 'BAN_USER'), `targetId`, `timestamp`.
*   **`reports` / `flags`**: Moderation queues for user-reported content.
*   **`reactions`**: Tracks user likes/dislikes on feedback to prevent duplicate voting.

## 6. Service Architecture (src/services)

Business logic is decoupled from UI in specialized service modules:

*   `authService`: Authentication & Session management.
*   `instructorService`: Fetching, filtering, and aggregating instructor data.
*   `feedbackService`: Handling ratings, replies, reactions, and flagging.
*   **`adminService`**: User management, reporting, and dashboard aggregation.
*   **`auditService`**: Centralized logging for security-critical actions.
*   `aiService`: Integration for sentiment analysis and insight generation.
*   `managementService`: High-level statistical aggregation for dashboards.

## 8. Billion-Dollar Features (Roadmap)
*   **AI Executive Summary**: Personalised insights for students and instructors based on sentiment analysis of hundreds of reviews.
*   **Real-time Reputation Engine**: Dynamic "Engagement Score" that rewards constructive feedback and active participation.
*   **Academic Predictor**: AI-driven course recommendations matching a student's preferred teaching style.
*   **Enterprise Moderation**: Advanced reporting and audit system with automated flag detection.
*   **Global Search & Discovery**: High-performance filtering and ranking system for instructors and courses.

---
*Updated for AcademicPulse System v2.0*
