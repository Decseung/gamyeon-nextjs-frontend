'use client'

import { motion, useAnimation } from 'framer-motion'
import { ReactNode, useEffect } from 'react'
import styles from './CardFluid.module.css'

interface CardContainerProps {
  children: ReactNode
  isHovered?: boolean
}

export function CardContainer({ children, isHovered = false }: CardContainerProps) {
  const cardControls = useAnimation()
  const shadowControls = useAnimation()

  useEffect(() => {
    if (isHovered) {
      cardControls.start({
        y: [0, -14, 0],
        rotateY: 180,
        scale: [1, 1.08, 1],
        transition: {
          y: { duration: 0.48, times: [0, 0.38, 1], ease: ['easeOut', [0.2, 0, 0.4, 1]] },
          rotateY: { type: 'spring', stiffness: 58, damping: 11, mass: 0.88 },
          scale: { duration: 0.48, times: [0, 0.36, 1], ease: ['easeOut', 'easeIn'] },
        },
      })
      shadowControls.start({
        opacity: [0.08, 0.28, 0.08],
        scaleX: [0.65, 0.9, 0.65],
        transition: { duration: 0.48, times: [0, 0.38, 1], ease: 'easeInOut' },
      })
    } else {
      cardControls.start({
        y: 0,
        rotateY: 0,
        scale: 1,
        transition: {
          y: { type: 'spring', stiffness: 700, damping: 22, mass: 0.6 },
          rotateY: { type: 'spring', stiffness: 58, damping: 11, mass: 0.88 },
          scale: { type: 'spring', stiffness: 700, damping: 22, mass: 0.6 },
        },
      })
      shadowControls.start({
        opacity: 0.08,
        scaleX: 0.65,
        transition: { type: 'spring', stiffness: 700, damping: 22, mass: 0.6 },
      })
    }
  }, [isHovered, cardControls, shadowControls])

  return (
    <div
      className={`@container relative aspect-[10/11] w-full ${styles.fluidCard}`}
      style={{ perspective: '900px' }}
    >
      {/* Dynamic drop shadow */}
      <motion.div
        className="pointer-events-none absolute inset-x-8 -bottom-1 -z-10 rounded-full bg-black blur-2xl"
        animate={shadowControls}
        initial={{ opacity: 0.08, scaleX: 0.65, y: 4 }}
        style={{ height: '30%' }}
      />

      <motion.div
        className="relative h-full min-h-0 w-full"
        animate={cardControls}
        initial={{ rotateY: 0, y: 0, scale: 1 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Shine sweep — front face only */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <motion.div
            className="absolute inset-y-0 w-2/5 -skew-x-12"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
            }}
            initial={false}
            animate={{ x: isHovered ? '370%' : '-150%' }}
            transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </motion.div>

        {children}
      </motion.div>
    </div>
  )
}
