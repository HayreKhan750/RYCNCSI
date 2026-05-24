# AcademicPulse: REAL-TIME INSTRUCTOR RATING SYSTEM
## TECHNICAL BLUEPRINT & SYSTEM ARCHITECTURE

---

### 1️⃣ SYSTEM OVERVIEW

#### Core Mission
AcademicPulse (AcademicPulse) is an enterprise-grade academic feedback ecosystem designed for the College of Natural and Computational Sciences. It serves as a transparent bridge between the student body and faculty, moving beyond static surveys into a real-time, data-driven performance analytics platform.

#### Problem Solved
Traditional academic evaluations are often delayed, private, and non-actionable. AcademicPulse solves this by providing:
- **Instant Transparency**: Students see instructor performance before enrolling.
- **Actionable Analytics**: Instructors receive immediate, categorised feedback to improve teaching methods.
- **Administrative Oversight**: Management can identify systemic pedagogical gaps or star performers via AI-driven summaries.

#### User Personas & Permissions
The system adopts a strict hierarchical role-based access control (RBAC) model:
1. **Student**: Consumers of instructor data and primary feedback providers. They can rate instructors, react to peers' feedback, and manage personal academic profiles.
2. **Instructor**: Subjects of evaluation with specialized dashboards. They can manage their public profiles, respond to student reviews, and view deep analytics on their teaching impact.
3. **Admin**: System operators responsible for data integrity (imports/exports), infrastructure maintenance, and high-level configuration.
4. **Management**: Executive-level users focused on department-wide or campus-wide analytics, moderation of flagged content, and strategic academic reporting.

#### High-Level Workflow
1. **Authentication**: Users enter via a unified Portal (Email/Google OAuth).
2. **Action Phase**:
   - *Student*: Navigates to an instructor profile, submits a multi-faceted rating (Overall score + custom pedagogical tags + textual feedback).
   - *Instructor*: Accesses a real-time Analytics Dashboard; reviews feedback and publishes responses.
3. **Data Processing (The Engine)**:
   - Feedback is saved to Firestore.
   - A **Cloud Function** (`onFeedbackCreated`) triggers immediately (Server-Side).
   - It performs **AI Analysis** (Sentiment/Toxicity) and updates the document securely.
   - It atomically increments the instructor's global statistics (`ratingCount`, `avgRating`).
4. **Analytics & Storage**: Data is indexed for high-performance retrieval.
5. **Insights Phase**: Management generates executive reports; Admins audit system logs for security.

---

### 2️⃣ FRONTEND ARCHITECTURE

#### UI Technology Stack
- **Framework**: React.js (v19) leveraging Functional Components and Hooks.
- **Styling**: A hybrid of **Tailwind CSS** for layout/spacing and **Vanilla CSS** for premium custom components (Glassmorphism, complex gradients).
- **Animations**: **Framer Motion** for layout transitions and micro-interactions.
- **Icons**: **Lucide React** for consistent vector iconography.
- **Charts**: **Recharts** or standard SVG for analytics visualization.

#### State Management Strategy
The system uses **Redux Toolkit** as its central nervous system, organized into feature-based slices:
- `authSlice`: Manages user identity, session state, and MFA status.
- `instructorSlice`: Caches instructor lists and profile details to minimize redundant API calls.
- `feedbackSlice`: Coordinates feedback submissions and real-time reaction updates.
- `managementSlice`: Handles high-level analytical data for executive views.
- `themeSlice`: Persists Dark/Light mode preferences across sessions.

#### Routing & Role-Based Views
Implemented via `react-router-dom` (v6+), using **Route Guards**:
- `ProtectedRoute`: Ensures session validity.
- `AdminRoute`: Verifies the `role === 'admin'` claim.
- `ManagementRoute`: Grants access to executive dashboards (`role === 'management' || 'admin'`).

#### Component Hierarchy
The UI follows an **Atomic Design** philosophy:

1. **Atomic Elements**: 
   - `Button`: Variants for Primary, Secondary, Glass, and Danger.
   - `Badge`: Status indicators (e.g., 'Instructor', 'Top Reviewer').
   - `Input`: Enhanced text and rating inputs with validation feedback.
   - `Loader`: Skeleton screens used during lazy loading and API fetching.

2. **Composite Components**:
   - `InstructorCard`: Displays avatar, name, department, and a star-rating summary.
   - `FeedbackCard`: Contains review text, student info, reaction buttons, and AI-detected tags.
   - `StatWidget`: Dynamic metric displays with sparklines for trend visualization.

3. **Page-Level Components**:
   - `Dashboard`: Personalized landing page per role.
   - `RatingPage`: A multi-step form for detailed instructor evaluations.
   - `ModerationConsole`: A list-heavy interface for Management to review flagged content.

#### Layout System
- **Responsive Grid**: A 12-column flexbox-based grid that collapses for mobile/tablet.
- **Sidebar Architecture**: A collapsible navigation drawer with role-specific menu items.
- **Header**: Integrated search engine and profile quick-actions.

#### Dark/Light Mode System
Implemented via a custom CSS Variables bridge. The `ThemeProvider` wraps the app and injects classes (`light-theme`, `dark-theme`) into the document root. Redux synchronizes the choice with localStorage, ensuring zero-flicker transitions.

#### Backend Communication Flow
Components *never* talk to Firebase directly. They use the **Service Layer abstraction**:
1. Component dispatches a **Redux Async Thunk**.
2. Thunk calls a function in `src/services/` (e.g., `feedbackService.submit()`).
3. Service interacts with Firestore.
4. Data is sanitized/serialized and returned to the Thunk.
5. Redux state updates, triggering a reactivity cycle in the UI.

---

### 3️⃣ BACKEND ARCHITECTURE

#### Service-Oriented Design
AcademicPulse employs a **Serverless Service-Oriented Architecture (SSOA)**. Rather than a monolithic backend, the system logic is distributed across lightweight, decoupled modules in `src/services/` that interface with Firebase's BaaS (Backend-as-a-Service).

#### Core Backend Services
- **Authentication Service (`authService.js`)**:
  - Handles multi-provider login (Email, Google).
  - Manages session persistence and logout logic.
  - Implements **Multi-Factor Authentication (MFA)** enrollment and verification flows.
  - Syncs Firebase Auth state with the Redux `authSlice`.

- **Instructor Service (`instructorService.js`)**:
  - Responsible for "Read-Optimized" instructor profiles.
  - Implements profile initialization for new instructors.
  - Manages course associations and personal bio updates.
  - High-performance lookup logic (Direct ID vs. UID fallback).

- **Feedback Service (`feedbackService.js`)**:
  - The "Transaction Engine" of the system.
  - Handles the submission of ratings and textual reviews.
  - Manages the **Reaction System** (Likes/Dislikes) using atomic transactions to prevent double-voting.
  - Facilitates the **Reply System**, allowing instructors to respond to feedback.

- **Moderation Service (`adminService.js`)**:
  - Provides interfaces for banning/suspending users.
  - Manages the **Flag Queue**, where reported feedback is reviewed.
  - Orchestrates content removal and user restriction updates.

- **Analytics & AI Service (`aiService.js` / `managementService.js`)**:
  - `aiService`: Simulates and interfaces with sentiment analysis logic (toxicity detection, tag extraction).
  - `managementService`: Aggregates system-wide data for executive dashboards (O(1) counts via `getCountFromServer`).
  - Calculates "Engagement Scores" and "Sentiment Trends" for departments.

- **Reporting Service**:
  - Integrated into `managementService`, this logic generates PDF and CSV reports for administrative use, leveraging client-side libraries (`jsPDF`, `html2canvas`) but driven by backend metadata.

#### API Boundaries & Decoupling
The architecture enforces a strict boundary:
- **UI** (Dispatch) → **Redux Thunk** → **Service Layer** → **Firebase SDK`.
- Services return **Serialized Objects** (standard JS POJOs) rather than raw Firebase `DocumentSnapshot` objects. This ensures that if the database provider changes, the UI remains unaffected.

#### Data Validation & Role Enforcement
Security is enforced at two levels:
1. **Client-Side Validation**: Services validate data structures (e.g., rating range 1-5, text length < 2000 characters) before sending to the network.
2. **Server-Side Rules (Single Source of Truth)**: `firestore.rules` acts as the final gatekeeper. It verifies that:
   - Only students can submit feedback.
   - Only instructors can reply to feedback.
   - Only admins can modify user roles or ban accounts.
   - Users can only edit their *own* profiles.

---

### 4️⃣ DATABASE & DATA MODEL

#### Schema Design Philosophy
AcademicPulse uses **Cloud Firestore** as its primary NoSQL database. The schema is designed for **Scalability** and **Read Performance**, favoring denormalized data structures that allow complex UI views to be populated with a single query.

#### Core Collections & Fields

| Collection | Purpose | Key Fields |
| :--- | :--- | :--- |
| **`users`** | Single Source of Truth for Identity | `uid`, `email`, `displayName`, `role` (student/instructor/admin), `mfaEnabled`, `lastLogin` |
| **`instructors`** | Read-Optimized Public Profiles | `instructorId`, `userId`, `fullName`, `departmentId`, `avgRating`, `ratingCount`, `courses` (Array) |
| **`feedbacks`** | Central Feedback Repository | `feedbackId`, `instructorId`, `studentId`, `rating`, `text`, `tags` (Array), `aiScore` (Map: toxicity, sentiment), `flagStatus` |
| **`replies`** | Instructor Responses | `replyId`, `feedbackId`, `authorId`, `text`, `createdAt` |
| **`reactions`** | Like/Dislike Tracking | `feedbackId_userId` (ID), `feedbackId`, `userId`, `type` (like/dislike) |
| **`flags`** | Moderation Queue | `flagId`, `feedbackId`, `flaggedBy`, `reason`, `status` (open/resolved) |
| **`audit_logs`** | Security Tracking | `logId`, `actorId`, `action` (e.g., 'BAN_USER'), `targetId`, `timestamp` |

#### Relationships & Referential Integrity
Since Firestore is NoSQL, relationships are managed via **Manual Referencing**:
- **Instructor ↔ User**: Linked via `userId`. An instructor document is a specialized extension of a user account.
- **Feedback ↔ Instructor**: Linked via `instructorId`.
- **Feedback ↔ Student**: Linked via `studentId` (UID of the student user).
- **Reply ↔ Feedback**: Linked via `feedbackId`.
- **Reaction ↔ Feedback**: Linked via `feedbackId`. The ID of a reaction document is deterministically set to `feedbackId_userId` to enforce a unique constraint (one reaction per user per feedback).

#### Denormalization Strategy
Data is denormalized to avoid expensive client-side joins:
- **`instructorName` in `feedbacks`**: Stored at submission time so the Feedback List doesn't need to look up instructor profiles for every row.
- **`ratingStats` in `instructors`**: The `avgRating` and `ratingCount` are pre-calculated and stored on the instructor document. This allows the Leaderboard to sort thousands of instructors instantly without scanning the `feedbacks` collection.
- **`stats.reviewsCount` in `users`**: Incremented on every feedback submission to power the "Top Reviewer" rankings.

#### Why Denormalize?
1. **Latency**: Loading a profile with 50 reviews requires 1 read for the profile + 1 query for reviews. Without denormalization, it would require 51+ reads.
2. **Cost**: Firestore charges per read. Denormalization reduces the number of documents retrieved per page load.
3. **Complexity**: NoSQL joins are handled in application logic; denormalizing simplifies this logic significantly.

---

### 5️⃣ CONCURRENCY CONTROL & DATA INTEGRITY

#### Handling Concurrent Submissions
In a high-traffic environment where multiple students may rate the same instructor simultaneously, AcademicPulse employs **Atomic Operations** and **Distributed Transactions** to ensure data consistency.

#### Avoiding Race Conditions
Race conditions typically occur when reading a value, modifying it, and writing it back. The system avoids this through:
- **Atomic Increments**: Global counters (like `ratingCount` or `reviewsCount`) use the `increment()` operator. This instruction is executed directly on the database server, ensuring that if 10 users click "Submit" at the exact same millisecond, the counter increases by exactly 10, with no lost updates.
- **Deterministic Document IDs**: For reactions (Likes/Dislikes), the system generates the ID as `` `${feedbackId}_${userId}` ``. This serves as a **Distributed Lock**. If a user tries to "Like" the same review twice in parallel, the second write will target the same document ID, effectively becoming a no-op or a controlled update rather than a duplicate entry.

#### Atomic Updates (The Transaction Flow)
For complex updates that involve multiple steps, specific services use `runTransaction()`:
1. **Request**: The client requests a transaction.
2. **Read Phase**: The system reads the current state of the involved documents (e.g., current rating sum and count).
3. **Validation**: Business logic ensures the update is valid (e.g., user hasn't already voted).
4. **Buffer Phase**: All writes and deletions are queued locally.
5. **Commit Phase**: The database executes all changes as a single atomic unit. If any document was changed by another user during the process, the transaction **automatically retries**.

#### Optimistic vs. Pessimistic Strategies
- **Pessimistic (Transactions)**: Used for Reactions and Ratings where accuracy is critical. We assume a conflict might happen and use locks (at the database level) to prevent corruption.
- **Optimistic (UI Layer)**: The frontend uses **Optimistic UI Updates**. When a user "Likes" a review, the Redux state toggles the active state and increments the counter *immediately* on the screen before the network call returns. If the API fails, the state is **rolled back** to its previous value. This provides a "zero-latency" feel without compromising backend integrity.

#### Integrity Constraints
- **Self-Cleaning References**: When a feedback document is deleted, the system uses a Cloud Function (or service logic) to decrement the instructor's `ratingCount` and recalculate the average.
- **Author Validation**: Every document write is checked against the `request.auth.uid`. A student cannot "spoof" a rating on behalf of another student because the backend rules verify the credentials before allowing the write.

---

### 6️⃣ SYNCHRONIZATION & SERIALIZATION

#### Client ↔ Server Synchronization
The system leverages Firebase's **Real-Time Listener Engine** (WebSockets/Long-Polling) to maintain state. While many fetches are one-time `getDocs()` calls for performance, critical areas like the **Moderation Queue** or **Real-Time Dashboards** utilize `onSnapshot()`.
- **Latency Compensation**: Any change made locally is immediately reflected in the client's internal cache before the server acknowledges it. This means the UI updates in <10ms, even with 300ms network latency.

#### Serialization Formats
Data traveling from Firestore is non-standard (containing `Timestamp` and `DocumentReference` objects). To ensure Redux compatibility and JSON readiness, the system uses a custom **`serializeFirestoreData`** utility:

1. **JSON Structure**: All incoming data is flattened into a standard JSON Object.
2. **Timestamp Normalization**: Firestore `Timestamp` objects are converted to **ISO 8601 strings** or **Unix Milliseconds** (`toMillis()`). This allows consistent date comparisons and sorting in the UI without re-instantiating `Date` objects.
3. **ID Injection**: The document's unique Firestore key is injected into the payload as `id: "doc_id"`, allowing lists to use stable keys for React rendering.

**Sample Serialized Feedback:**
```json
{
  "id": "FB_9921",
  "instructorId": "INST_ADAM",
  "studentId": "USER_Sarah",
  "rating": 4.5,
  "text": "Highly inspirational professor.",
  "createdAt": 1705470000000,
  "aiScore": { "toxicity": 0.01, "sentiment": 0.9 }
}
```

#### Ordering Guarantees
The system enforces strict ordering through database-level `orderBy` clauses and client-side sorting:
- **Feedbacks**: Sorted by `createdAt` (Descending) to ensure the latest reviews appear first.
- **Replies**: Nested within feedback, sorted by `createdAt` (Ascending) to maintain a logical conversation flow.
- **Pagination Cursors**: When loading more reviews, the system uses the `createdAt` value of the last visible item as a **pagination cursor** (`startAfter(lastTimestamp)`). This ensures that new reviews submitted while a user is scrolling don't cause duplicates or gaps in the list.

#### Real-Time Update Strategy
1. **Critical Data** (e.g., Auth status, Notifications): Constant real-time subscription.
2. **Static Data** (e.g., Instructor Bio): One-time fetch on mount.
3. **Analytical Data** (e.g., Global Averages): Fetched once, then updated manually via Redux or a refresh trigger to avoid excessive read costs.

---

### 7️⃣ PERFORMANCE OPTIMIZATION TECHNIQUES

#### Indexing Strategies
To prevent the "O(N) search problem," AcademicPulse leverages **Firestore Composite Indexes**. This allows the system to execute complex queries (e.g., "Get all feedback for Instructor X, sorted by rating, filtered by department") in **O(log N)** time.
- Standard fields (IDs, timestamps) use Single-Field Indexes.
- Analytics views use **Composite Indexes** (combined keys) to satisfy multi-where-clause queries without needing manual client-side filtering.

#### List Virtualization
When viewing an instructor with hundreds of reviews, the browser can lag due to DOM overhead. AcademicPulse solves this via **`VirtualList.js`**:
- **Concept**: Only the 10-20 reviews currently visible on the screen are rendered into the DOM.
- **Benefit**: Memory usage remains constant regardless of the total number of reviews, keeping the application snappy on mobile devices.

#### Lazy Loading & Code Splitting
The application employs **Lazy Loading** (via `React.lazy` and `Suspense`) for every major page and component.
- The initial bundle only contains the Login/Auth logic (~50KB).
- The "Management Dashboard" or "Admin Panel" modules are only downloaded if the user has the required roles and navigates to those URLs.
- This significantly improves **First Contentful Paint (FCP)** and reduces bandwidth for student-only users.

#### Query Aggregation & Memoization
- **Backend Aggregation**: Instead of calculating the average rating by fetching all FEEDBACK documents, the system reads a single field on the INSTRUCTOR document. This field is updated asynchronously or via atomic increments.
- **Redux Selectors**: The system uses **Memoized Selectors** (via `createSelector`). If the UI requests "count of 5-star reviews," Redux remembers the result and only re-calculates it if the underlying feedback array actually changes.

#### Pagination Mechanics
- **Infinite Scroll**: Feedback lists don't load all at once. They fetch in batches of 20 using **Query Cursors**.
- **Skeleton Loaders**: While the next batch is fetching, the system displays animated CSS skeletons (`SkeletonLoader.js`) to provide immediate visual feedback and prevent layout shifts.

#### Image & Asset Caching
- **Cloudinary Optimization**: Profile pictures are served via Cloudinary. The system requests specific widths and heights at the URL level (e.g., `w_200,h_200,c_fill,q_auto,f_auto`), ensuring users never download a 5MB image for a 40px avatar.
- **Service Worker Caching**: Static assets (logos, CSS, JS) are cached locally to enable faster subsequent loads and limited offline functionality.

---

### 8️⃣ AI & ANALYTICS ENGINE

#### Sentiment Analysis Flow
Every piece of textual feedback passes through an automated **AI Pipeline** (executed securely via Cloud Functions).
1. **Submission**: User submits feedback.
2. **Preprocessing**: The text is cleaned of noise and HTML entities.
3. **Analysis**: The engine calculates:
   - **Sentiment Score**: Range from -1 (Negative) to +1 (Positive).
   - **Toxicity Score**: Range from 0 to 1.
4. **Storage**: These scores are stored directly on the `feedback` document in the `aiScore` map, allowing for instant filtering without re-running the AI.

#### Toxicity Detection & Auto-Moderation
The system acts as a first-line moderator:
- If a review exceeds a **Toxicity Threshold** (e.g., > 0.8), the system automatically sets `flagStatus = 'flagged'`.
- The review is hidden from the public view and placed in the **Management Moderation Queue**.
- An audit log is generated: `SYSTEM_FLAG_TOXIC_CONTENT`.

#### Tag Extraction & Thematic Analysis
The AI doesn't just read sentiment; it identifies **Pedagogical Themes**. It extracts tags such as:
- `"Inspirational"`
- `"Tough Grader"`
- `"Clear Communication"`
- `"Heavy Workload"`
These are stored as a searchable array, enabling students to search for instructors based on teaching style rather than just name.

#### Risk Scoring for Instructors
For Management, the system calculates a **Risk Score**:
- Derived from a weighted average of recent negative sentiment, high flag counts, and sudden drops in average rating.
- **Risk Levels**: `Low` (Normal), `Medium` (Needs Monitoring), `High` (Immediate Assessment Required).
- This allows Academic Deans to proactively support instructors before issues escalate.

#### Trend & Predictive Analytics
- **Trend Analysis**: The `managementService` samples recent feedbacks to visualize "Sentiment over Time." This is displayed as linear or area charts on the Executive Dashboard.
- **Predictive Analytics**: Based on historic rating cycles (e.g., midterms vs. finals), the system alerts management to expected surges in feedback volatility.

#### AI Data Reuse
- To minimize costs and latency, AI results are **never re-calculated** unless the review is edited. The `ai_insights` collection serves as a cache for higher-level summaries (e.g., "Monthly Executive Summary for Mathematics Department"), which are generated once a month and shared across all management users.

---

### 9️⃣ SECURITY & ACCESS CONTROL

#### Multi-Layered Authentication
AcademicPulse employs a **Defense-in-Depth** strategy for authentication:
1. **Identity Provider (IdP)**: Users authenticate via Firebase Auth.
2. **Session Persistence**: JWT (JSON Web Tokens) are handled securely by the Firebase SDK, stored in `IndexedDB`.
3. **MFA (Multi-Factor Authentication)**: High-privilege roles (Admin/Management) are prompted for a second factor (Email OTP or Authenticator) during login, as managed by the `authService`.

#### Role-Based Access Control (RBAC)
User roles are stored in two places for redundancy and security:
- **Firestore Document**: The `users/{uid}` document contains the `role` field. This is the **Primary Source**.
- **Custom Claims** (Optional/Systemic): High-level roles can be mirrored in Auth Custom Claims for zero-latency server-side checks in Cloud Functions.

| Role | Permissions |
| :--- | :--- |
| **Student** | Create Feedbacks, Like/Dislike, Edit Personal Profile. |
| **Instructor** | Read Personal Analytics, Reply to Reviews, Manage Courses. |
| **Management** | View Executive Reports, Moderation (Flag Management). |
| **Admin** | Role Assignment, User Banning, Infrastructure Scaling. |

#### Security Rules (The Final Gatekeeper)
The `firestore.rules` file enforces fine-grained authorization:
- **`isOwner(uid)`**: Ensures only the user with that UID can modify their data.
- **`isAdmin()` / `isManagement()`**: Helper functions that read the authenticated user's role before allowing access to `audit_logs` or `flags`.
- **Integrity Checks**: Rules verify that `request.resource.data.rating` is a number between 1 and 5. If a malicious user tries to send a rating of `10` via the API console, the database will **Reject** the write.

#### Audit Logging
Every sensitive action (e.g., `BAN_USER`, `DELETE_FEEDBACK`, `CHANGE_ROLE`) triggers an entry in the **`audit_logs`** collection.
- Logs are **Immutable**: Rules allow `create` but forbid `update` or `delete` for anyone, including Admins.
- Contains: `actorId`, `actionName`, `targetId`, `timestamp`, and `metadata` (e.g., reason for ban).

#### Abuse Prevention
- **Rate Limiting**: Integrated via Client-side cooldowns and Firebase Security rules (e.g., preventing a student from submitting 100 ratings in 1 minute).
- **Flagging System**: Crowdsourced moderation. If a review receives > 5 flags from unique users, it is automatically hidden pending Management review.
- **Input Sanitization**: All textual inputs are stripped of script tags and dangerous HTML before storage to prevent XSS (Cross-Site Scripting) attacks.

---

### 10️⃣ END-TO-END USER FLOWS

#### Flow A: Student Submits Feedback
1. **Selection**: Student selects an Instructor from the Dashboard.
2. **Interface**: The `RatingPage.js` multi-step form gathers the numeric rating (1-5), textual feedback, and pedagogical tags.
3. **Dispatch**: Redux dispatches `submitFeedback`.
4. **API Service**: `feedbackService.submitFeedback()` performs basic validation and sends data to Firestore.
5. **DB Layer**: The `feedbacks` collection receives a new document. Security rules verify the `studentId`.
6. **Cloud Function Trigger**: The `onFeedbackCreated` trigger executes on the server:
   - Calculates **AI Scores** (Toxicity/Sentiment) and updates the feedback doc.
   - Atomically increments `ratingCount` and recalculates `avgRating` on the Instructor document.
   - (Optional) Increments `reviewsCount` on the Student's user document.
7. **UI Refresh**: The student's dashboard updates via the Redux reactivity cycle.

#### Flow B: Instructor Replies to Feedback
1. **Notification**: Instructor logs into the dashboard and sees a new review.
2. **Action**: Clicks "Respond" on the `FeedbackCard`.
3. **Dispatch**: Redux dispatches `addReply`.
4. **API Service**: `feedbackService.addReply()` verifies the instructor's role and ownership of the course.
5. **DB Layer**: A new document is added to the `replies` top-level collection (or nested sub-collection).
6. **Update**: The `replyCount` on the parent feedback document is incremented.
7. **UI Refresh**: The student and instructor both see the reply in real-time.

#### Flow C: Content Moderation (Flagging)
1. **Trigger**: A student or AI flags a review for "Offensive Language."
2. **Flag Record**: `feedbackService.flagFeedback()` creates a document in the `flags` collection.
3. **Status Update**: The feedback document's `flagStatus` changes to `'flagged'`.
4. **Management Interface**: A Management user opens the `FeedbackConsole.jsx`.
5. **Adjudication**: Management reviews the flag and selects "Remove" or "Keep."
6. **Execution**:
   - If "Remove": The feedback is soft-deleted or hidden. Instructor stats are adjusted back.
   - If "Keep": The `flagStatus` is set to `'resolved'`.
7. **Audit**: An entry is made in `audit_logs` tracking the moderator's decision.

#### Flow D: Management Reporting
1. **Entry**: Management navigates to `management/dashboard`.
2. **Aggregation**: `managementService.fetchDashboardStats()` executes `getCountFromServer()` for efficiency.
3. **Visualization**: Data is fed into `AISummaryPanel.jsx` and `DepartmentList.jsx` to render charts and trend lines.
4. **Export**: User clicks "Download PDF."
5. **Local Logic**: `jspdf` and `html2canvas` capture the rendered DOM and generate an executive report for the Academic Council.

---

### 🔚 FINAL SECTION: MENTAL MODEL & SCALE

#### The Complete Mental Model
The AcademicPulse system is essentially a **Reactive Data Pipeline**.
- Think of it as a set of **Listeners** and **Transformers**.
- The "Source" is student feedback.
- The "Transformer" is the Service/AI layer.
- The "Sinks" are the varied Dashboards (Student, Instructor, Management).
Data flows from the edge (UI) to the core (DB/AI) and back out to the edge in a continuous, multi-directional loop.

#### Architectural Rationale
- **Why Firebase?**: Real-time requirements and role-based security rules make Firebase the ideal Choice for a rapidly evolving academic environment. It eliminates the need for managing server infrastructure (DevOps).
- **Why Redux Toolkit?**: The complexity of multi-role states and cross-component reactivity (e.g., updating a rating and seeing the leaderboard change) requires a predictable, immutable state container.
- **Why Denormalization?**: High-traffic academic systems face "Read Surges" (e.g., during registration). Denormalization ensures that these surges don't crash the database or slow down the user experience.

#### Scaling Strategy
The system scales horizontally at every layer:
1. **Frontend**: Assets are delivered via Global CDN, ensuring zero-latency downloads worldwide.
2. **Database**: Firestore is built on Google's Spanner infrastructure, capable of handling millions of concurrent users and petabytes of data without manual sharding.
3. **AI**: The AI services run on serverless functions which spin up or down based on demand, ensuring cost-efficiency during low-activity periods and extreme performance during peak rating seasons.

#### Long-Term Maintainability
1. **Service Decoupling**: By isolating Firebase logic in the `src/services/` layer, the team can swap out the database or AI provider in the future without touching 90% of the UI code.
2. **Atomic UI**: The component library is modular and documented. Adding a new feature (e.g., "Parent View" or "Course Analytics") is as simple as composing existing atomic elements.
3. **Automated Auditing**: The immutable logging system ensures that as the system grows, administrative actions remain transparent and traceable, reducing the operational burden on the IT department.

**Conclusion**: AcademicPulse is not just a rating site; it is a high-performance, AI-augmented infrastructure for academic excellence. It is built to be fast, secure, and infinitely scalable.

---
*Blueprint Documentation End*
