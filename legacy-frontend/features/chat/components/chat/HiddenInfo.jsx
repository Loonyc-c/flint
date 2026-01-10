import React from "react";

export default function HiddenInfo({ hiddenCount = 0 }) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Hidden ({hiddenCount})</h3>
      <p className="text-sm text-neutral-500">
        Inactive chats are hidden after 3 days. New activity unhides them.
      </p>
    </div>
  );
}
