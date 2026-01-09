'use client'

import { Mic } from 'lucide-react'

/**
 * Widget for recording voice introductions.
 * Currently displays UI with placeholder functionality.
 */
export const VoiceIntroWidget = () => (
  <section className="bg-neutral-900 dark:bg-neutral-800 rounded-3xl p-6 shadow-xl flex items-center justify-between group overflow-hidden relative">
    <div className="absolute inset-0 bg-linear-to-r from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex items-center gap-4 relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/40">
        <Mic className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-black text-white text-sm uppercase tracking-wide">Voice Intro</h3>
        <p className="text-xs text-neutral-400">Let them hear your vibe</p>
      </div>
    </div>
    <button
      type="button"
      className="bg-white text-black px-6 py-2 rounded-full text-xs font-black active:scale-95 transition-all relative z-10"
    >
      RECORD
    </button>
  </section>
)
