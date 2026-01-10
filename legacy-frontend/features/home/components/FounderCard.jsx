import React from "react";

export default function FounderCard({ image, name, role, description }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl text-center shadow-xl max-w-sm">
      <img
        src={image}
        alt={name}
        className="w-28 h-28 mx-auto rounded-full object-cover shadow-md"
      />
      <h3 className="mt-4 text-lg font-bold text-white">{name}</h3>
      <p className="text-brand-200 font-semibold">{role}</p>
      <p className="text-zinc-300 mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
