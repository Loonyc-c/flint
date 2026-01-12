'use client'

interface CarouselDotsProps {
  total: number
  current: number
  onSelect: (idx: number) => void
}

export const CarouselDots = ({ total, current, onSelect }: CarouselDotsProps) => (
  <div className="absolute left-0 right-0 z-20 flex gap-1.5 px-4 top-4">
    {Array.from({ length: total }).map((_, idx) => (
      <button
        key={idx}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(idx)
        }}
        className={`
          flex-1 h-1 rounded-full transition-all duration-300 cursor-pointer
          ${idx === current ? 'bg-white shadow-lg shadow-white/30' : 'bg-white/40 hover:bg-white/60'}
        `}
        aria-label={`View photo ${idx + 1}`}
      />
    ))}
  </div>
)
