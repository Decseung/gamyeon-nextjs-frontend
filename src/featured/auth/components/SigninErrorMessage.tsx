'use client'

import { motion } from 'framer-motion'

interface SigninErrorMessageProps {
  message: string
}

export function SigninErrorMessage({ message }: SigninErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border-destructive/20 flex items-start gap-2.5 rounded-lg border px-4 py-3"
    >
      <svg
        className="text-destructive mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-destructive text-sm">{message}</p>
    </motion.div>
  )
}
