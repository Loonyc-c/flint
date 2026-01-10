import { ChevronLeft, Phone, Settings, Send } from "lucide-react";
function ThreadItem({ convo, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-xl border text-left px-3 py-3",
        active
          ? "border-brand/40 ring-1 ring-brand/40 bg-brand/5"
          : "border-neutral-200 bg-white hover:bg-neutral-50",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <img
          src={convo.avatar}
          alt={convo.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0">
          <div className="font-semibold">{convo.name}</div>
          <div className="text-sm text-neutral-500 truncate">
            {convo.messages[convo.messages.length - 1]?.text || "New chat"}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Sidebar({ conversations, activeId, onPick }) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Messages</h2>
        <button className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-neutral-100">
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>

      <div className="flex flex-col divide-y divide-neutral-100">
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3">Your turn</h3>
          <div className="flex flex-col gap-3">
            {conversations.slice(0, 1).map((c) => (
              <ThreadItem
                key={c.id}
                convo={c}
                active={c.id === activeId}
                onClick={() => onPick(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3">Their turn</h3>
          <div className="flex flex-col gap-3">
            {conversations.slice(1, 3).map((c) => (
              <ThreadItem
                key={c.id}
                convo={c}
                active={c.id === activeId}
                onClick={() => onPick(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold mb-2">Hidden (12)</h3>
          <p className="text-sm text-neutral-500">
            Inactive chats are hidden after 14 days. New activity unhides them.
          </p>
        </div>
      </div>
    </div>
  );
}
