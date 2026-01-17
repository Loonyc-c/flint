# Developer Guide: Global Socket & Notification Service

## 1. Architecture Overview

Flint uses a single, persistent WebSocket connection established at the application root to handle real-time signaling, presence, and global notifications. This ensures consistency and prevents socket "ghosting" or redundant connections during page transitions.

### Key Components
- **`GlobalSocketProvider`**: Manages the `Socket.io` client instance.
- **`GlobalNotificationListener`**: A headless component that listens for global events and displays UI feedback (toasts).
- **`useGlobalSocket`**: The primary hook for features to access the shared socket.

---

## 2. GlobalSocketContext

The context provider is responsible for the socket lifecycle, authentication, and global state synchronization.

### Connection Lifecycle
- **Auto-Auth**: Connectivity is tied to the user's JWT token. The provider connects automatically when a token is present and disconnects on logout.
- **Auto-Rejoin**: On reconnection, the provider automatically rejoins all active match rooms stored in its internal registry.
- **State Sync**: Listens for `busy-states-sync` to maintain an up-to-date presence map of matched users.

### API Reference (`useGlobalSocket`)
| Method / Value | Type | Description |
| :--- | :--- | :--- |
| `socket` | `Socket \| null` | The raw Socket.io client instance. |
| `isConnected` | `boolean` | Real-time connection status. |
| `joinMatch(id)`| `function` | Joins a specific match room and adds it to the auto-rejoin list. |
| `busyStates` | `Record` | A map of user IDs to their current status (`queueing`, `in-call`, etc.). |

---

## 3. Global Notification Service

The `GlobalNotificationListener` is a passive component mounted at the root. It bridges backend signals to the `react-toastify` UI.

### Supported Event: `notification`
The backend can emit a generic `notification` event with the following payload:
```typescript
{
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string; // App-relative path for redirection on click
}
```

### Supported Event: `call-request`
Specifically for incoming calls, providing a global entry point for the call system regardless of which page the user is currently on.

---

## 4. Developer Guide: Adding New Features

### Case A: Adding a New Global Event
If you need to listen for a new real-time event that should trigger UI feedback globally:
1. **Define the Event**: Add the event listener inside `GlobalNotificationListener.tsx`.
2. **Avoid State in UI**: Keep the listener "headless." If the event requires complex state updates, consider if it belongs in the `GlobalSocketProvider` or a feature-specific context.
3. **Redirection**: If the notification should lead the user somewhere, use the `link` property and ensure it's handled by the `router.push` logic.

### Case B: Adding Presence-Based Logic
If you want to hide UI elements based on user availability:
1. Use `useGlobalSocket()` to access `busyStates`.
2. Call `isUserBusy(userId)` to check if a partner is currently available for a call.

### Case C: Feature-Specific Listeners
For logic that only applies to a single page (e.g., chat typing indicators):
1. Use `useGlobalSocket()` to get the raw `socket`.
2. Manage the listener inside the feature component's `useEffect`.
3. **CRITICAL**: Always implement the cleanup function (`socket.off(event)`) to prevent duplicate listeners.

---

## 5. Security & Safety Concerns
- **Token Injection**: The socket automatically injects the `auth.token` into the connection handshakes. Never manually append tokens to event payloads.
- **Strict Typing**: When possible, use shared event name constants from `@shared/types` to ensure frontend/backend alignment.
- **Reconnection Handling**: Always handle the `connect` event if your feature requires immediate synchronization after a network drop.
