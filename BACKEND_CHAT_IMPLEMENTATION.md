# Backend Implementation Documentation: Chat System

This document outlines the steps required to implement the backend API for the new Chat functionality, integrated with the existing `DiscoveryHub` frontend.

## 1. Data Model (`shared/types/chat.ts`)

Ensure the `ChatConversation` and `Message` types are defined as follows (already present in shared types):

```typescript
export interface Message {
  id: string
  matchId: string
  senderId: string
  text: string
  createdAt: string // ISO string
  readAt?: string
}

export interface ChatConversation {
  id: string // This is the matchId
  matchId: string
  otherUser: {
    id: string
    name: string
    avatar?: string
  }
  lastMessage?: Message
  unreadCount: number
  isTheirTurn: boolean
}
```

## 2. API Endpoints

We need to implement the following REST endpoints in the backend.

### 2.1 Get Messages
*   **Method:** `GET`
*   **Path:** `/matches/:matchId/messages`
*   **Protected:** Yes
*   **Description:** Retrieves the message history for a specific match.
*   **Response:** `Message[]`

### 2.2 Send Message
*   **Method:** `POST`
*   **Path:** `/matches/:matchId/messages`
*   **Protected:** Yes
*   **Body:** `{ text: string }`
*   **Description:** Sends a new message to a match. This should:
    1.  Create the message record.
    2.  Update the `Match` record's `lastMessageAt` and `lastMessage` fields (for efficient sorting/preview).
    3.  Update the `unreadCount` for the recipient.
    4.  Update the `currentTurn` on the Match record.
*   **Response:** `Message`

### 2.3 Mark as Read (Optional but Recommended)
*   **Method:** `POST`
*   **Path:** `/matches/:matchId/read`
*   **Protected:** Yes
*   **Description:** Marks all messages in a match as read by the current user.

## 3. Database Schema Updates

### 3.1 Messages Collection (`messages`)
We need a new collection for storing messages.

```typescript
// backend/src/data/db/types/message.ts
import { ObjectId } from 'mongodb'

export interface DbMessage {
  _id?: ObjectId
  matchId: string // Store as string to match match._id format
  senderId: string
  text: string
  createdAt: Date
  readAt?: Date
  isDeleted: boolean
}
```

### 3.2 Match Collection Updates (`matches`)
Update the existing `DbMatch` interface to support chat metadata for performance (avoiding expensive aggregation for the list view).

```typescript
// Update backend/src/data/db/types/match.ts
export interface DbMatch {
  // ... existing fields
  lastMessage?: {
    text: string
    senderId: string
    createdAt: Date
  }
  unreadCounts?: Record<string, number> // UserID -> Count map
  currentTurn?: string // UserID of whose turn it is
}
```

## 4. Service Implementation (`chat.service.ts`)

Create `backend/src/features/chat/services/chat.service.ts`:

*   **`getMessages(matchId: string, userId: string): Promise<Message[]>`**
    *   Verify user is part of the match.
    *   Find messages where `matchId` matches.
    *   Sort by `createdAt` asc.

*   **`sendMessage(matchId: string, userId: string, text: string): Promise<Message>`**
    *   Verify match exists and user is a participant.
    *   Insert `DbMessage` into `messages` collection.
    *   Update `matches` collection:
        *   Set `lastMessage` to the new message.
        *   Increment `unreadCounts` for the *other* user.
        *   Set `currentTurn` to the *other* user.

## 5. Handlers Implementation

Create handlers in `backend/src/features/chat/handlers/`:

*   `get-messages.ts` -> Calls `chatService.getMessages`
*   `send-message.ts` -> Calls `chatService.sendMessage`

## 6. Routing

*   Create `backend/src/features/chat/routes.ts`.
*   Register the routes in `backend/src/routes/protected.ts`.

## 7. Frontend Integration

Once the backend is ready:
1.  Update `frontend/src/features/chat/api/chat.ts` to replace the mock `MOCK_MESSAGES` with real `apiRequest` calls to the new endpoints.
2.  Update `useMatches` hook to populate `unreadCount`, `isTheirTurn`, and `lastMessage` from the real API response (which might require updating `matchService.getMatches` in the backend to include this data).

