'use client'

import { motion } from 'framer-motion'
import { Camera, Plus } from 'lucide-react'
import Image from 'next/image'

interface PhotoGridProps {
  photos: string[]
  onAddPhoto?: (index: number) => void
}

export const PhotoGrid = ({ photos, onAddPhoto }: PhotoGridProps) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 px-2">
        <Camera className="w-4 h-4 text-brand" />
        <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">Media</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map(idx => (
          <motion.div
            key={idx}
            {...({
              whileTap: { scale: 0.95 },
              onClick: () => onAddPhoto?.(idx),
              className: 'aspect-[3/4] rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-brand/50 transition-all shadow-xs',
            } as any)}
          >
            {photos?.[idx] ? (
              <Image src={photos[idx]} fill className="object-cover" alt={`Profile ${idx + 1}`} />
            ) : (
              <Plus className="w-6 h-6 text-neutral-300 group-hover:text-brand transition-colors" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
