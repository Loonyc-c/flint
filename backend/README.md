# Flint Backend API

Dating app backend with real-time messaging, matching algorithm, and AI wingman features.

## 🚀 Features

- **Authentication**: Email/Password & Google OAuth
- **Profile Management**: User profiles with photos, bio, interests
- **Swipe System**: Like/Dislike/Superlike functionality
- **Matching Algorithm**: Smart matching based on preferences
- **Real-time Chat**: Socket.IO powered messaging
- **AI Wingman**: Conversation suggestions and analysis
- **3-Stage Dating**: Voice → Video → Contact sharing
- **Image Upload**: Cloudinary integration

## 📁 Project Structure

```
BackEnd/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── swipe.controller.js
│   │   ├── match.controller.js
│   │   ├── message.controller.js
│   │   └── ai.controller.js
│   ├── models/          # Database schemas
│   │   ├── user.model.js
│   │   ├── match.model.js
│   │   ├── swipe.model.js
│   │   └── message.model.js
│   ├── routes/          # API routes
│   │   ├── auth.route.js
│   │   ├── profile.route.js
│   │   ├── swipe.route.js
│   │   ├── match.route.js
│   │   ├── message.route.js
│   │   └── ai.route.js
│   ├── middleware/      # Custom middleware
│   │   └── auth.middleware.js
│   ├── lib/            # Utilities
│   │   ├── db.js
│   │   ├── jwt.js
│   │   ├── cloudinary.js
│   │   ├── google.js
│   │   └── socket.js
│   └── index.js        # Entry point
└── package.json
```

## 🛠️ Installation

1. **Clone the repository**

```bash
cd BackEnd
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit `.env` file with your credentials:

- MongoDB URI
- JWT Secret
- Cloudinary credentials
- Google OAuth credentials (optional)
- OpenAI API key (optional)

4. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check authentication status
- `PUT /api/auth/update-profile` - Update profile picture

### Profile

- `GET /api/profile/me` - Get current user profile
- `GET /api/profile/:userId` - Get user profile by ID
- `PUT /api/profile/update` - Update profile info
- `PUT /api/profile/upload-profile-pic` - Upload profile picture
- `POST /api/profile/upload-photo` - Upload additional photo
- `DELETE /api/profile/delete-photo` - Delete photo
- `DELETE /api/profile/delete-account` - Delete account

### Swipe

- `GET /api/swipe/candidates` - Get users to swipe on
- `POST /api/swipe` - Swipe on a user (like/dislike/superlike)
- `GET /api/swipe/likes` - Get users who liked you
- `GET /api/swipe/history` - Get swipe history

### Matches

- `GET /api/matches` - Get all matches
- `GET /api/matches/:matchId` - Get specific match
- `PUT /api/matches/:matchId/stage` - Update match stage
- `DELETE /api/matches/:matchId` - Unmatch

### Messages

- `GET /api/messages/:matchId` - Get messages for a match
- `POST /api/messages` - Send a message (turn-based)
- `PUT /api/messages/:matchId/read` - Mark messages as read
- `POST /api/messages/:matchId/pass` - Pass turn to other user

### AI Wingman

- `POST /api/ai/wingman` - Get conversation suggestions
- `POST /api/ai/analyze` - Analyze conversation
- `POST /api/ai/opener` - Generate conversation openers

## 🔌 Socket.IO Events

### Client → Server

- `join-match` - Join a match room
- `leave-match` - Leave a match room
- `typing` - Send typing indicator

### Server → Client

- `new-message` - New message received
- `new-match` - New match created
- `user-typing` - Other user is typing
- `stage-updated` - Match stage updated

## 🔐 Authentication

All protected routes require JWT token in cookies. The token is automatically set on login/signup.

Socket.IO connections require token in handshake:

```javascript
const socket = io("http://localhost:5002", {
  auth: { token: "your-jwt-token" },
});
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **socket.io** - Real-time communication
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cloudinary** - Image hosting
- **google-auth-library** - Google OAuth
- **cors** - CORS middleware
- **cookie-parser** - Cookie parsing
- **dotenv** - Environment variables

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5002/api/health

# Test signup
curl -X POST http://localhost:5002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123"}'
```

## 🎯 Matching System

### How Matching Works

1. **User Preferences**

   - Each user sets preferences for potential matches:
     - Gender preference (`male`, `female`, `other`, `all`)
     - Age range (min/max)
     - Maximum distance (in km)

2. **Candidate Feed**

   - Users are shown filtered candidates based on their preferences
   - Excludes users who have been:
     - Already swiped on (liked/disliked)
     - Already matched with
     - Blocked
   - Candidates are fetched in batches (default: 10)

3. **Swipe Actions**

   - **Like**: Express interest in a user
   - **Dislike/Pass**: Skip a user
   - **Superlike**: Show extra interest (premium feature)
   - **Save**: Bookmark for later

4. **Match Creation**

   - When User A likes User B, a swipe record is created
   - If User B has also liked User A → **Match is created**
   - Match document contains:
     - Both users' IDs
     - Match status (`matched`, `pending`, `rejected`, `blocked`)
     - Stage (0-3 for dating progression)
     - Turn-based chat state
     - Last message timestamp
     - Unread counts per user

5. **Daily Limits**
   - Free users: Limited likes per day
   - Premium users: Unlimited likes

### MongoDB Schema: Match

```javascript
{
  users: [ObjectId, ObjectId],           // Both users in the match
  status: "matched",                      // matched | pending | rejected | blocked
  stage: 0,                               // 0=just matched, 1=voice, 2=video, 3=contact shared
  stageHistory: [{ stage: Number, completedAt: Date }],
  lastMessageAt: Date,
  unreadCount: Map<userId, Number>,      // Unread count per user
  currentTurn: ObjectId,                  // Whose turn it is to send message
  turnHistory: [{
    user: ObjectId,
    action: "message" | "pass",
    timestamp: Date
  }],
  lastTurnChangeAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Example: Creating a Match

```javascript
// In swipe.controller.js
if (action === "like" || action === "superlike") {
  // Check if the other user has also liked
  const reciprocalSwipe = await Swipe.findOne({
    from: targetUserId,
    to: req.user._id,
    action: { $in: ["like", "superlike"] },
  });

  if (reciprocalSwipe) {
    // Create a match - user who swiped second gets first turn
    match = await Match.create({
      users: [req.user._id, targetUserId],
      status: "matched",
      stage: 0,
      currentTurn: req.user._id,
      lastTurnChangeAt: new Date(),
    });

    // Emit real-time notification to both users
    emitNewMatch(req.user._id.toString(), match);
    emitNewMatch(targetUserId.toString(), match);
  }
}
```

---

## 💬 Turn-Based Chat System

### How Turn-Based Chat Works

Flint uses a unique **turn-based messaging system** to encourage thoughtful conversations:

1. **Match Creation**

   - When a match is created, the user who swiped second gets the **first turn**
   - `currentTurn` field stores whose turn it is

2. **Sending Messages**

   - Only the user whose turn it is can send a message
   - After sending, the turn automatically switches to the other user
   - Turn history is tracked for analytics

3. **Passing Turn**

   - Users can pass their turn without sending a message
   - Useful when they want to give the other person a chance to respond

4. **Message Types**
   - **Text messages**: Standard text (max 2000 characters)
   - **Voice messages**: Audio recordings with duration

### MongoDB Schema: Message

```javascript
{
  matchId: ObjectId,                      // Reference to Match
  sender: ObjectId,                       // Reference to User
  messageType: "text" | "voice",
  text: String,                           // For text messages (max 2000 chars)
  voiceUrl: String,                       // Cloudinary URL for voice messages
  voiceDuration: Number,                  // Duration in seconds
  status: "pending" | "sent" | "delivered" | "read",
  read: Boolean,
  readAt: Date,
  deliveredAt: Date,
  localId: String,                        // Client-generated ID for offline support
  isOffline: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Backend: Send Message Controller

```javascript
// POST /api/messages
export const sendMessage = async (req, res) => {
  const { matchId, text, messageType, voiceUrl, voiceDuration } = req.body;

  // 1. Verify match exists and user is part of it
  const match = await Match.findById(matchId);
  if (!match) return res.status(404).json({ message: "Match not found" });

  const isUserInMatch = match.users.some(
    (user) => user.toString() === req.user._id.toString()
  );
  if (!isUserInMatch) return res.status(403).json({ message: "Unauthorized" });

  // 2. Check if it's the user's turn
  if (match.currentTurn?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "It's not your turn to send a message",
      currentTurn: match.currentTurn,
    });
  }

  // 3. Create message
  const message = await Message.create({
    matchId,
    sender: req.user._id,
    messageType: messageType || "text",
    text: messageType === "text" ? text.trim() : undefined,
    voiceUrl: messageType === "voice" ? voiceUrl : undefined,
    voiceDuration: messageType === "voice" ? voiceDuration : undefined,
    status: "sent",
  });

  // 4. Update match: switch turn to other user
  const otherUserId = match.users.find(
    (user) => user.toString() !== req.user._id.toString()
  );

  match.currentTurn = otherUserId;
  match.lastTurnChangeAt = new Date();
  match.lastMessageAt = new Date();

  // Increment unread count for other user
  const currentUnread = match.unreadCount.get(otherUserId.toString()) || 0;
  match.unreadCount.set(otherUserId.toString(), currentUnread + 1);

  // Add to turn history
  match.turnHistory.push({
    user: req.user._id,
    action: "message",
    timestamp: new Date(),
  });

  await match.save();

  // 5. Emit real-time message via Socket.IO
  emitNewMessage(matchId, message);

  return res.status(201).json(message);
};
```

### Backend: Pass Turn Controller

```javascript
// POST /api/messages/:matchId/pass
export const passTurn = async (req, res) => {
  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) return res.status(404).json({ message: "Match not found" });

  // Check if it's the user's turn
  if (match.currentTurn?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "It's not your turn" });
  }

  // Switch turn to the other user
  const otherUserId = match.users.find(
    (user) => user.toString() !== req.user._id.toString()
  );

  match.currentTurn = otherUserId;
  match.lastTurnChangeAt = new Date();

  match.turnHistory.push({
    user: req.user._id,
    action: "pass",
    timestamp: new Date(),
  });

  await match.save();

  return res.json({
    message: "Turn passed successfully",
    currentTurn: match.currentTurn,
  });
};
```

### Frontend: React State Logic

```javascript
// Example React component showing turn-based chat UI
import { useState, useEffect } from "react";
import { useMatchStore } from "@/store/useMatchStore";
import { useMessageStore } from "@/store/useMessageStore";

function ChatView({ matchId }) {
  const { currentMatch } = useMatchStore();
  const { messages, sendMessage, passTurn } = useMessageStore();
  const [messageText, setMessageText] = useState("");

  // Determine if it's the current user's turn
  const isMyTurn = currentMatch?.currentTurn?.toString() === authUser?.id;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !isMyTurn) return;

    await sendMessage(matchId, messageText, "text");
    setMessageText("");
  };

  const handlePassTurn = async () => {
    await passTurn(matchId);
  };

  return (
    <div className="chat-container">
      {/* Turn indicator */}
      <div className="turn-indicator">
        {isMyTurn ? (
          <span className="text-green-600">✓ Your Turn</span>
        ) : (
          <span className="text-gray-500">Their Turn</span>
        )}
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.from === "me" ? "my-message" : "their-message"}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input (disabled when not user's turn) */}
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={!isMyTurn}
          placeholder={isMyTurn ? "Type a message..." : "Wait for your turn..."}
        />
        <button type="submit" disabled={!isMyTurn || !messageText.trim()}>
          Send
        </button>
        {isMyTurn && (
          <button type="button" onClick={handlePassTurn}>
            Pass Turn
          </button>
        )}
      </form>
    </div>
  );
}
```

### Real-time Updates via Socket.IO

```javascript
// Client-side Socket.IO setup
import io from "socket.io-client";

const socket = io("http://localhost:5002", {
  auth: { token: yourJwtToken },
});

// Join a match room
socket.emit("join-match", matchId);

// Listen for new messages
socket.on("new-message", (message) => {
  // Add message to UI
  addMessageToChat(message);
});

// Listen for turn changes
socket.on("turn-changed", ({ matchId, currentTurn }) => {
  // Update UI to show whose turn it is
  updateTurnIndicator(currentTurn);
});

// Send typing indicator
socket.emit("typing", { matchId, isTyping: true });
```

---

## 🚧 TODO

- [ ] Implement OpenAI integration for AI Wingman
- [ ] Add Twilio integration for video/voice calls
- [ ] Add rate limiting
- [ ] Add input validation with Joi/Zod
- [ ] Add unit tests
- [ ] Add API documentation with Swagger
- [ ] Implement geolocation-based matching
- [ ] Add push notifications
- [ ] Add email verification
- [ ] Add password reset functionality

## 📝 License

MIT

## 👥 Authors

Flint Team
