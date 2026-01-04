# Architecture: Dating Web Application Backend (Vercel Serverless & Simplified)

## 📋 Requirements Summary

### Functional:

- **Match Flow (Swipe Match Flow)**:
  - Step 1: User swipe for match.
  - Step 2: Voice Call (chat opens after match).
  - Step 3: Video Call (staged call dating starts). Accept/Reject via chat, 10-second ring.
  - Step 4: Contact Exchange (if both accept, live staged call room opens). 3 call stages with accept/reject modal at Stage 3.
- **Call Flow Logic**:
  - 10-second "uncomfortable" check for cancel option (not direct cancel).
  - Skip button always visible, requires mutual agreement (one initiates, other accepts).
  - Clear post-call user actions (chat, match history).
- **User Pages (Frontend API Needs)**: Profile, Messages, Matches, Subscription/Upgrade, Matching Preferences (age, gender, distance filter), Swipe, Likes & Matches (paid users only for "liked you").
- **Chat (Web)**:
  - Text-only messages (no voice/image).
  - Mute, Block, Unmatch, Delete chat.
  - "Your turn / Their turn" logic.
  - Chat hidden after 3 days inactive.
  - Seen / Unseen status.
- **Register & Authentication**:
  - Email verification code (email service integration).
  - Password requirements (1 special char, 1 capital, 1 number).
  - Google account login/signup.
- **Live Call Matching & AI Wingman**:
  - AI Wingman: Generates questions every 15-20 seconds (Deep, Silly, Toxic types).
  - "Next question" button for quick answers.
  - 20-second extension option if not answered.
  - AI Wingman type re-selection on Stage 1 -> Stage 2 transition.
  - Stage 2 Camera Rules: Mandatory on start, option to close every 20s, re-open anytime.
- **Account Completion & Verification**:
  - ID upload (image).
  - 3rd party image verification (age check, e.g., 2008 ID -> blocked if <18).
- **Real-Time Notifications**: New Chat, New Match, Live Call Request (ringing, accept/reject modal).
- **Landing / Intro Page (Backend support)**: Signup page redirection, language toggle.
- **Matching Algorithm Factors**: Gender, Age, Hobby, Verified Account, Score increments (3-stage call completion, Smash/Superlike).
- **Profile Settings**: Location selection (Mongolian cities list). Simplify profile update to 1-2 tables.
- **Swipe Animation**: Backend API should be fast enough not to introduce delays.
- **Image Uploads**: User uploads multiple images via Cloudinary; URLs stored in DB.
- **Voice Records**: User records answers to questions; uploaded to Cloudinary; URLs stored in DB.

### Non-Functional:

- **Deployment**: Vercel (serverless functions).
- **Payment**: Initial development without payment integration; full flow first, then integrate a suitable payment solution (Byl.mn, research others).
- **Performance**: Smooth swipe animation, minimal delay when switching users. Loading pages for slow pages.
- **Scalability**: Sufficient for a prototype, scales with Vercel.
- **Security**: Password requirements, ID verification, secure authentication.
- **Maintainability**: Clean code, simplified profile tables.
- **Budget & Complexity**: As low as possible for a prototype. No event-driven services.

---

### Constraints & Assumptions:

- **Backend Stack**: Node.js, TypeScript, Express.js (used within Vercel functions for routing/middleware, not as a standalone server).
- **Deployment Platform**: Vercel for serverless functions.
- **Database**: MongoDB (external, managed service like MongoDB Atlas).
- **Cloud Provider**: AWS services will _not_ be the primary focus for serverless functions, given Vercel. Managed third-party services are preferred for simplicity and budget.

---

## 🏗️ High-Level Architecture

The system will now primarily rely on Vercel Serverless Functions for all API logic. Real-time communication will be delegated to a managed third-party service, and media handling (WebRTC) remains external.

```mermaid
graph TD
    A[Client (Web/Mobile)] -- HTTPS --> B(Vercel Edge Network / Serverless Functions)
    B -- Call API --> C(MongoDB Atlas)
    B -- Call API --> D(Cloudinary)
    B -- Call API --> E(Managed WebSocket Service)
    B -- Call API --> F(Email Service)
    B -- Call API --> G(3rd Party ID Verification Service)
    B -- Call API --> H(External LLM API)

    A -- WebSocket --> E
    A -- WebRTC --> I(Media / Call Service)
```

**Key Components**:

1.  **Vercel Serverless Functions (Node.js/TypeScript)**:
    - All API endpoints (e.g., user management, profiles, matching, chat state management, staged call orchestration) will be implemented as individual Vercel serverless functions.
    - These functions handle HTTP requests, interact with MongoDB, Cloudinary, Email Service, ID Verification, and the Managed WebSocket Service.
    - AI Wingman logic will be directly integrated into relevant call functions, making calls to an External LLM API.

2.  **Managed WebSocket Service (e.g., Pusher, Ably)**:
    - A third-party service that handles persistent WebSocket connections from clients.
    - Manages real-time text chat, call signaling (initiate, accept, reject), and pushes notifications to clients.
    - Vercel functions will use the service's API (REST or SDK) to publish and subscribe to real-time events, which are then relayed to connected clients by the managed service.

3.  **MongoDB Atlas**:
    - A fully managed NoSQL database service (MongoDB as a Service). This offloads database operations and scaling to a provider, aligning with budget and low complexity goals.
    - Primary data store for all application data: users, profiles, matches, chat messages, call history, preferences, etc.

4.  **Cloudinary**:
    - A managed service for image and video (and audio) management.
    - Clients will upload images (profile pictures, ID scans) and voice records directly to Cloudinary (using signed upload URLs from Vercel functions).
    - Cloudinary provides storage, transformations, and global delivery. Only the URLs are stored in MongoDB.

5.  **Media / Call Service (WebRTC SFU/MCU)**:
    - This component remains external and cannot be run on Vercel functions. It's a dedicated service (e.g., using Kurento Media Server, Jitsi Video Bridge, Twilio Programmable Video) responsible for establishing and managing WebRTC voice and video streams for live calls.
    - The Managed WebSocket Service will handle the signaling (SDP exchange, ICE candidates), but the actual media traffic will flow through this service.

6.  **Email Service**:
    - A third-party email service (e.g., SendGrid, Mailgun) for sending email verification codes. Vercel functions will call its API.

7.  **3rd Party ID Verification Service**:
    - An external API service for age and identity checks from uploaded ID images. Vercel functions will call its API.

8.  **External LLM API**:
    - An external Large Language Model API (e.g., OpenAI API, Gemini API) that the AI Wingman logic within Vercel functions will call to generate questions during live calls.

---

## 🔧 Technology Choices

| Component              | Technology                                                 | Why This Choice                                                                                                                                                                               |
| :--------------------- | :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend API**        | Vercel Serverless Functions (Node.js/TypeScript)           | Serverless, scales automatically, pay-per-execution, low ops burden, fits Vercel deployment.                                                                                                  |
| **Database**           | MongoDB Atlas                                              | Fully managed, flexible schema, scales, high availability, budget-friendly for prototypes.                                                                                                    |
| **Real-time Comms**    | Managed WebSocket Service (e.g., Pusher, Ably)             | Low complexity for real-time features with serverless functions, handles connection scaling and reliability.                                                                                  |
| **Media / Call**       | WebRTC (Client-side) + Twilio Programmable Video (Managed) | WebRTC is standard. Twilio offers a fully managed WebRTC solution, significantly reducing complexity and operational overhead compared to self-hosting a media server, ideal for a prototype. |
| **File Storage**       | Cloudinary                                                 | Managed image/video/audio storage, delivery, and transformations. Simplifies media pipeline.                                                                                                  |
| **Email Verification** | SendGrid / Mailgun                                         | Managed transactional email service, easy API integration.                                                                                                                                    |
| **ID Verification**    | 3rd Party ID Verification API                              | Offloads complex verification logic; specific choice depends on budget/features.                                                                                                              |
| **AI Wingman Logic**   | External LLM API (e.g., OpenAI API, Gemini API)            | Leverage existing powerful models; cost-effective (pay-per-use), easy to integrate via HTTP requests.                                                                                         |
| **Auth Strategy**      | JWT (JSON Web Tokens)                                      | Standard for stateless authentication in RESTful APIs, suitable for serverless functions.                                                                                                     |
| **Validation**         | Joi / Zod                                                  | Robust schema validation for API requests.                                                                                                                                                    |

---

## 🗂️ Data Model (MongoDB)

The data model remains largely the same, optimized for MongoDB's document structure and common access patterns. This allows for flexibility and addresses the "1-2 table" requirement for user profiles by embedding data.

### 1. `User` Collection (No Change)

### 2. `Match` Collection (No Change)

### 3. `Chat` Collection (No Change)

### 4. `StagedCall` Collection (No Change)

### 5. `Swipe` Collection (Optional, No Change)

---

## 🔐 Security Considerations

1.  **Authentication**:
    - **JWT (JSON Web Tokens)**: Users authenticate via Vercel functions and receive a JWT. This token is sent with every subsequent request.
    - **Password Hashing**: Store passwords using strong hashing algorithms (e.g., bcrypt) with a salt.
    - **Email Verification**: Mandate email verification using a third-party email service.
    - **Google OAuth**: Implement secure OAuth 2.0 flow for Google login/signup, managed by Vercel functions.

2.  **Authorization**:
    - Ensure Vercel functions strictly check user authorization (via JWT) to access/modify only their own data or data they are authorized for.

3.  **Data Protection**:
    - **HTTPS**: All communication between client and Vercel functions _must_ use HTTPS.
    - **Data at Rest Encryption**: MongoDB Atlas provides data at rest encryption. Cloudinary and managed WebSocket services also handle this.
    - **Sensitive Data Handling**: Contact info only revealed with mutual consent. ID images in Cloudinary with restricted access.

4.  **Input Validation**:
    - Strictly validate all incoming data within Vercel functions to prevent attacks and ensure data integrity.

5.  **Rate Limiting**:
    - Vercel might offer some platform-level rate limiting, but implement API-specific rate limiting within your functions for critical endpoints.

6.  **Secrets Management**:
    - Store API keys and sensitive configuration in Vercel Environment Variables, not directly in code. MongoDB Atlas connection strings, Cloudinary API keys, etc. - [ ] API route to create a chat session upon match.
    * [ ] API route (`/api/chat/send`) that publishes messages to the Managed WebSocket Service.
    * [ ] Client-side listens for chat messages from the Managed WebSocket Service.
    * [ ] Implement "Your turn / Their turn" logic (can be handled client-side with backend state for validation).
    * [ ] Implement "Seen / Unseen" status logic.
    * [ ] API routes for "Mute," "Block," "Unmatch," "Delete chat."
    * [ ] Scheduled Vercel function (or external cron job) to hide inactive chats (3 days) by updating `isHidden` flag.

7.  **Staged Call Orchestration (Days 31-35)**
    - [ ] Implement `StagedCall` model t

---

## 📊 Trade-Offs & Limitations

### Pros:

- **Low Operational Overhead**: Vercel, MongoDB Atlas, Cloudinary, and managed WebSocket/WebRTC services handle infrastructure, scaling, and maintenance.
- **Cost-Effective for Prototype**: Pay-per-execution model for Vercel functions and managed services means you only pay for what you use, ideal for an uncertain user base.
- **Simplified Development**: Focus on business logic rather than infrastructure. No complex event buses or custom server scaling.
- **Global Edge Network**: Vercel provides fast global access.
- **Scalability**: Managed services scale transparently for a prototype's needs.

### Cons:

- **Vendor Lock-in**: Tightly coupled to Vercel and chosen third-party services.
- **Cold Starts**: Vercel functions can experience cold starts, adding latency to initial requests. Optimize function size to mitigate.
- **Debugging Complexity**: Distributed nature of serverless functions and multiple third-party services can make debugging harder. Centralized logging (e.g., Vercel Logs) is crucial.
- **Cost Escalation**: While cheap for low usage, costs for managed services can rise sharply with high usage.
- **Managed WebSocket Service Limits**: May have limitations on concurrent connections or message throughput compared to custom-tuned solutions, depending on the chosen provider and plan.

### When to Revisit:

- **High User Growth**: Review cost-effectiveness of current managed services. Consider dedicated infrastructure for specific high-traffic components if costs become prohibitive.
- **Unique Requirements**: If custom WebRTC features or deeply integrated real-time processing are needed beyond what managed services offer, a custom media server or more specialized WebSocket backend might be required.
- **Payment Integration**: This will add a new set of API functions and possibly a payment gateway webhook receiver.

---

## 🚀 Implementation Roadmap (Adjusted for Vercel)

### 🎯 Goal

Achieve a fully functional core dating application backend using Vercel Serverless Functions and managed third-party services, supporting multi-stage matching, real-time chat, live calls with AI assistance, and robust user management, without initial payment integration, prioritizing budget and low complexity.

---

### 📅 Milestones

**Milestone 1: Foundational Services & User Management (Weeks 1-3)**
Establish the core Vercel API routes, database, and user authentication.

**Tasks**:

1.  **Vercel Project Setup (Days 1-3)**
    - [ ] Initialize a new Vercel project with a Node.js/TypeScript template.
    - [ ] Configure `vercel.json` for API routes.
    - [ ] Set up ESLint, Prettier, `tsconfig.json`.
    - [ ] Integrate MongoDB Atlas (Mongoose/Typegoose for ODM).
    - [ ] Configure Vercel Environment Variables for secrets (MongoDB URI, Cloudinary API keys, etc.).
    - [ ] Implement basic error handling and logging within Vercel functions.

2.  **User Authentication & Profiles (Days 4-10)**
    - [ ] Implement `User` model (schema for basic profile, auth details).
    - [ ] **Registration API Route**: `/api/signup` (email, password, basic profile).
      - [ ] Password hashing (bcrypt).
      - [ ] Password requirements validation.
      - [ ] Email verification flow (generate token, send via SendGrid/Mailgun API, `/api/verify-email` endpoint).
    - [ ] **Login API Route**: `/api/login` (email/password), generate JWT.
    - [ ] **Google Auth**: Integrate Google OAuth 2.0 for signup/login via an API route.
    - [ ] **Profile Management API Routes**: CRUD for user profiles (`/api/users/[userId]`, `/api/users/[userId]/preferences`).
      - [ ] Ensure `profile` data is embedded, `preferences` is embedded.

3.  **Cloudinary & Media Uploads (Days 11-15)**
    - [ ] Configure Cloudinary API access in Vercel environment variables.
    - [ ] Implement API route (`/api/upload/image` or `/api/upload/audio`) to:
      - [ ] Generate signed upload URLs for direct client-to-Cloudinary uploads (preferred for performance).
      - [ ] (Alternative: Handle server-side upload to Cloudinary via Vercel function).
    - [ ] Update `User` model to store Cloudinary URLs for profile images and voice records.
    - [ ] API routes for fetching user images/audio from Cloudinary URLs.

**Success Criteria**: Users can register, log in (email/Google), upload images/voice records to Cloudinary, update their profile/preferences, and these actions persist in MongoDB.

---

**Milestone 2: Real-time Communication & Staged Calls (Weeks 4-8)**
Implement real-time chat, call signaling, and the multi-stage call logic using a managed WebSocket service.

**Tasks**:

1.  **Managed WebSocket Service Integration (Days 16-20)**
    - [ ] Choose and sign up for a managed WebSocket service (e.g., Pusher, Ably).
    - [ ] Configure API keys in Vercel environment variables.
    - [ ] Integrate the service's SDK into your Vercel functions.
    - [ ] Establish client-side connection to the WebSocket service.

2.  **Basic Swipe & Match (Days 21-25)**
    - [ ] Implement `Match` model.
    - [ ] API route for users to swipe on profiles (`/api/swipe`).
      - [ ] Logic to detect a mutual "like" and create a `Match` record.
      - [ ] Publish `newMatchEvent` to the Managed WebSocket Service, notifying both users.
    - [ ] API route to retrieve potential matches for swiping (based on preferences, distance, etc.).
    - [ ] API route for `Matches` page data (list of matched users).

3.  **Text Chat Functionality (Days 26-30)**
    - [ ] Implement `Chat` model for storing messages.
    - [ ] API route to create a chat session upon match.
    - [ ] API route (`/api/chat/send`) that publishes messages to the Managed WebSocket Service.
    - [ ] Client-side listens for chat messages from the Managed WebSocket Service.
    - [ ] Implement "Your turn / Their turn" logic (can be handled client-side with backend state for validation).
    - [ ] Implement "Seen / Unseen" status logic.
    - [ ] API routes for "Mute," "Block," "Unmatch," "Delete chat."
    - [ ] Scheduled Vercel function (or external cron job) to hide inactive chats (3 days) by updating `isHidden` flag.

4.  **Staged Call Orchestration (Days 31-35)**
    - [ ] Implement `StagedCall` model to manage call states.
    - [ ] API routes to initiate a staged call (`/api/call/initiate`) via a `Match` ID.
    - [ ] Vercel functions publish call requests (ringing) to the Managed WebSocket Service.
    - [ ] API routes for `acceptCall`, `rejectCall`, `startStage`, `endStage`, `skip`, `cancel`.
    - [ ] Call state machine logic managed by Vercel functions, triggering updates via WebSocket service.
    - [ ] Implement 10-second ring/timeout logic using scheduled tasks (Vercel cron jobs or external service if precise timing is critical).

**Success Criteria**: Users can initiate a multi-stage call, accept/reject, proceed through voice and video stages, exchange contact info (if agreed), and engage in real-time text chat via the managed WebSocket service.

---

**Milestone 3: AI Wingman, Verification & Refinements (Weeks 9-12)**
Add intelligent assistance, account security, and final algorithm touches.

**Tasks**:

1.  **Media Server Integration (Days 36-40)**
    - [ ] Choose and integrate with a managed WebRTC service (e.g., Twilio Programmable Video).
    - [ ] Vercel functions will generate access tokens and manage rooms/participants for Twilio.
    - [ ] Managed WebSocket Service handles signaling for Twilio's WebRTC sessions (or Twilio's own signaling).

2.  **AI Wingman (Days 41-45)**
    - [ ] Integrate an External LLM API (e.g., OpenAI, Gemini API) within Vercel functions.
    - [ ] Implement API route (`/api/call/ai-question`) that:
      - [ ] Receives current call stage and type preference.
      - [ ] Calls the LLM API to generate a question.
      - [ ] Publishes the question to the Managed WebSocket Service for delivery to call participants.
    - [ ] Implement logic for "Next question" and "Extend 20 seconds" features.

3.  **Account Verification (Days 46-50)**
    - [ ] API route (`/api/upload/id`) for user to upload ID images to Cloudinary (signed uploads).
    - [ ] API route (`/api/verify/id`) that:
      - [ ] Calls the 3rd party ID verification service API with the Cloudinary URL.
      - [ ] Updates `User` model with verification status.
      - [ ] Implements logic to block underage users.

4.  **Matching Algorithm Refinements & Scoring (Days 51-55)**
    - [ ] Update matching algorithm within relevant API routes (e.g., `/api/swipe`, `/api/matches`) to incorporate Gender, Age, Hobby, Verified Account, Distance.
    - [ ] Implement scoring logic: increment `matchScore` for 3-stage call completion, Smash/Superlike (API routes update `User` score).

**Success Criteria**: AI Wingman assists in calls, users receive real-time updates through the WebSocket service, and accounts can be verified via ID upload.

---

### 🚀 Where to Start Today

**Step 1** (Week 1): Set up your Vercel project, MongoDB Atlas, Cloudinary, and implement core user authentication.

1.  **Vercel Project & MongoDB Atlas**:
    - Sign up for Vercel and MongoDB Atlas (start with a free tier).
    - Create a new Vercel project, and link your Git repository.
    - Create an `api` folder in your project root.
    - Inside `api`, create `signup.ts`, `login.ts`, `users/[userId].ts` (for profile management).
    - Configure `MONGODB_URI` in Vercel Environment Variables.
    - Integrate Mongoose into your Vercel functions (e.g., a shared `lib/mongodb.ts` for connection).

2.  **User Authentication (API Routes)**:
    - Define the `User` MongoDB schema.
    - Implement `/api/signup.ts`:
      - Handle POST request.
      - Receive email, password, basic profile info.
      - Hash password. Store in MongoDB.
      - Generate JWT. Return token.
    - Implement `/api/login.ts`:
      - Handle POST request.
      - Verify email/password.
      - Generate JWT. Return token.
    - Implement a basic JWT authentication middleware that can be used across your Vercel API routes.

3.  **Cloudinary Integration**:
    - Sign up for Cloudinary (free tier).
    - Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in Vercel Environment Variables.
    - Create `/api/upload/signed-url.ts` route to generate a signed upload URL for the client.

This revised starting point quickly gets you into the Vercel serverless paradigm and integrates the core managed services.

---

### ⚠️ Common Pitfalls to Avoid

1.  **Vercel Cold Starts**: Keep your Vercel functions lean. Avoid large dependencies if possible.
2.  **Stateless Functions**: Remember Vercel functions are stateless. Any session information must be passed (e.g., JWT) or stored externally (e.g., MongoDB, Redis for caching).
3.  **Database Connections**: Ensure your MongoDB connection is established efficiently within Vercel functions (e.g., a singleton connection to avoid reconnecting on every invocation).
4.  **Third-Party API Rate Limits**: Be mindful of rate limits for Cloudinary, LLM APIs, Email services, and ID verification services. Implement retries with exponential backoff if necessary.
5.  **Cost Monitoring**: Keep an eye on usage for all managed services (Vercel, MongoDB Atlas, Cloudinary, Twilio, WebSocket service, LLM API) to stay within budget, especially during testing.
6.  **Security for Direct Uploads**: When using signed URLs for direct client-to-Cloudinary uploads, ensure the signature is generated securely by your Vercel function and has appropriate access controls.
7.  **Real-time Logic**: While the managed WebSocket service handles connections, your Vercel functions still need to correctly publish/subscribe to events. Test this thoroughly.
8.  **Error Handling**: Implement robust error handling and logging for all Vercel functions. Vercel's built-in logging will be valuable.
