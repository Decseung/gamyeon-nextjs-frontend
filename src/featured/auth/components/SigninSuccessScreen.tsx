'use client'

import { motion } from 'framer-motion'

export function SigninSuccessScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-primary h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          </motion.svg>
        </div>
        <p className="text-foreground font-medium">로그인 성공!</p>
        <p className="text-muted-foreground text-sm">잠시 후 이동합니다...</p>
      </motion.div>
    </div>
  )
}
