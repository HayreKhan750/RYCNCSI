# RYCNCSI - System Overview & Architecture Guide

## 1. Introduction
**RYCNCSI** (Rate Your CNCS Instructor) is a modern, full-featured web application designed to facilitate feedback and engagement between students and instructors at the College of Natural and Computational Sciences (CNCS). It allows students to rate instructors, view profiles, and track their own engagement, while providing instructors with powerful analytics and tools to manage their professional presence.

## 2. Technology Stack

### Frontend
*   **Framework**: React.js (v18+)
*   **State Management**: Redux Toolkit (Slices for Auth, User, Instructor, Feedback, Admin, Theme)
*   **Routing**: React Router v6 (Protected Routes, Role-based Access)
*   **Styling**: Vanilla CSS with a custom "Premium" Design System (Glassmorphism, Gradients, Dark/Light Mode)
*   **Build Tool**: Webpack (via Create React App)

### Backend (Serverless)
*   **Platform**: Firebase
*   **Database**: Cloud Firestore (NoSQL)
*   **Authentication**: Firebase Auth (Email/Password, Google Sign-In)
*   **Storage**: Cloudinary (for optimized image storage) & Firebase Storage (Legacy)
*   **Hosting**: Firebase Hosting (implied)

## 3. User Roles & Access Control

The system supports three distinct user roles, managed via custom claims and Firestore user documents:

1.  **Student**: The default role. Can rate instructors, view profiles, and manage their own profile.
2.  **Instructor**: Can view their own analytics, reply to reviews, manage their courses, and edit their public profile.
3.  **Admin**: Has full system access. Can manage users (ban/approve), import data, and view system-wide statistics.

## 4. Core Features & Functionality

### A. Authentication & Security
*   **Login/Signup**: Secure email/password and Google authentication.
*   **MFA (Multi-Factor Authentication)**: Optional security layer using Email OTP.
*   **Role-Based Route Protection**: `ProtectedRoute` and `AdminRoute` components ensure users only access authorized pages.
*   **Session Management**: Persistent sessions with automatic state restoration on reload.

### B. Student Module
*   **Dashboard**:
    *   **Welcome Hero**: Personalized greeting with engagement stats (Courses Taken, Rated, Score).
    *   **Top Instructors**: A "Discovery" widget showing the highest-rated instructors.
    *   **Top Reviewers**: A leaderboard of the most active student reviewers.
    *   **Quick Actions**: Fast access to Rating, My Ratings, and Feedback.
*   **Rate Instructors**:
    *   **Search & Filter**: Find instructors by name, department, or rating.
    *   **Rating Interface**: A multi-step or modal-based form to submit star ratings, tags (e.g., "Inspirational", "Tough Grader"), and written reviews.
    *   **Anonymous Rating**: Option to submit feedback anonymously.
*   **Student Profile**:
    *   **Public/Private View**: View own stats and edit profile details (Name, Bio, Department).
    *   **Avatar Upload**: Integration with Cloudinary for profile picture uploads.
    *   **Activity History**: List of past ratings and reviews given.

### C. Instructor Module
*   **Dashboard**:
    *   **Performance Metrics**: Real-time stats on Average Rating, Total Reviews, and Engagement Score.
    *   **Visual Charts**: Trend lines for ratings over time and tag distribution.
    *   **AI Summary**: An auto-generated summary of student sentiment (e.g., "Students find you challenging but fair").
    *   **Recent Feedback**: A feed of the latest reviews with "Reply" functionality.
*   **Public Profile**:
    *   **Rich Header**: Displays avatar, bio, department, and badges (e.g., "🏆 Top Rated").
    *   **Course List**: Shows courses taught by the instructor.
    *   **Reviews & Replies**: Public view of student feedback and instructor responses.
*   **Tools**:
    *   **Edit Profile**: Update bio, contact info, and profile picture.
    *   **Analytics Report**: (Mockup) Functionality to download performance reports.

### D. Admin Module
*   **Dashboard**: High-level overview of system health (Total Users, Total Ratings).
*   **User Management**: Table view to search, filter, ban, or promote users.
*   **Data Importer**: A tool to bulk-import instructor and course data from JSON files (`my-file.optimized.json`).
*   **System Settings**: Configuration for global app behavior.

## 5. Data Architecture (Firestore)

*   **`users` Collection**: Stores user profiles.
    *   Fields: `uid`, `email`, `displayName`, `role`, `photoURL`, `department`, `bio`, `createdAt`.
*   **`feedbacks` Collection**: Stores individual ratings.
    *   Fields: `instructorId`, `studentId`, `rating`, `feedback`, `tags`, `courseId`, `timestamp`, `likes`.
*   **`replies` Collection**: Stores instructor replies to feedback.
    *   Fields: `feedbackId`, `authorId`, `text`, `timestamp`.

## 6. UI/UX Design Philosophy

The application follows a **"Premium Modern"** aesthetic:
*   **Glassmorphism**: Heavy use of semi-transparent backgrounds with blur effects (`backdrop-filter: blur`).
*   **Gradients**: Vibrant, dynamic gradients for buttons, text, and borders.
*   **Animations**: Smooth transitions using CSS animations (Fade In, Slide Up).
*   **Responsive**: Fully adaptive layout for Desktop, Tablet, and Mobile.
*   **Dark/Light Mode**: System-wide theme switching support.

## 7. Key Workflows

### 1. Instructor Data Sync
The system uses a "Fuzzy Matching" logic to link the static schedule data (JSON) with registered instructor accounts. This ensures that when an instructor registers with an email or name similar to the schedule, they automatically inherit their courses and "Rate" profile.

### 2. Profile Image Handling
Profile images are uploaded via a dedicated component (`UploadProfileImage.js`) to Cloudinary. The returned URL is stored in Firestore (`photoURL` and `profilePictureUrl`) and synchronized across Redux to appear in:
*   Navbars
*   Dashboards
*   Review Cards
*   Public Profiles

### 3. Rating Flow
1.  Student searches for an instructor.
2.  If the instructor exists in JSON but not Firestore, a placeholder document is created.
3.  Student submits rating.
4.  `instructorSlice` and `feedbackSlice` update to reflect the new average and count.

## 8. Directory Structure Highlights

*   `src/components`: Reusable UI components (Buttons, Cards, Modals).
*   `src/pages`: Top-level page views (Settings, Login).
*   `src/store`: Redux logic (Slices, Selectors, Middleware).
*   `src/services`: API wrappers for Firebase and Cloudinary.
*   `src/hooks`: Custom hooks for data fetching (`useStudentProfile`, `useInstructorProfile`).
*   `src/assets`: Static data files (JSON schedule).

---
*Generated by Antigravity for RYCNCSI Project Documentation*
