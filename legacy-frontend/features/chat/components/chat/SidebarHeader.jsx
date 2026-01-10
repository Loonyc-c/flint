// src/components/chat/SidebarHeader.jsx
import React from "react";
import { Settings } from "lucide-react";

export default function SidebarHeader({ title = "Messages" }) {
  return (
    <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-neutral-100">
        <Settings className="h-4 w-4" />
        <span className="text-sm">Settings</span>
      </button>
    </div>
  );
}
