import React from "react";
import ThreadItem from "./ThreadItem";

export default function ThreadGroup({ title, items, activeId, onPick }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-3">
        {items.map((c) => (
          <ThreadItem
            key={c.id}
            convo={c}
            active={c.id === activeId}
            onClick={() => onPick(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
