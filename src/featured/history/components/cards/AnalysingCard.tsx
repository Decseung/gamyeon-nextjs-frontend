import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'

export function AnalysingCard() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-5 text-center @[280px]:p-8">
      <div className="mb-3 rounded-full bg-yellow-100 p-5 @[280px]:mb-5 @[280px]:p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RotateCw className="h-8 w-8 text-yellow-600 @[280px]:h-12 @[280px]:w-12" />
        </motion.div>
      </div>
      <h3 className="mb-1 text-sm font-bold text-gray-900 @[280px]:mb-2 @[280px]:text-lg">
        AI 리포트 분석중...
      </h3>
      <p className="text-xs text-gray-500 @[280px]:text-sm">
        면접 영상을 분석하고 있습니다.
        <br />
        잠시만 기다려주세요.
      </p>
      <div className="mt-4 flex gap-1.5 @[280px]:mt-6 @[280px]:gap-2">
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-yellow-500 @[280px]:h-2 @[280px]:w-2"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-yellow-500 @[280px]:h-2 @[280px]:w-2"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-yellow-500 @[280px]:h-2 @[280px]:w-2"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </div>
  )
}
