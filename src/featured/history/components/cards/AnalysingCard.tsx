import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'

export function AnalysingCard() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center @[180px]:p-4 @[220px]:p-5 @[280px]:p-6">
      <div className="mb-2 rounded-full bg-yellow-100 p-3 @[180px]:mb-3 @[180px]:p-4 @[220px]:p-5 @[280px]:mb-4 @[280px]:p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RotateCw className="h-6 w-6 text-yellow-600 @[180px]:h-8 @[180px]:w-8 @[220px]:h-10 @[220px]:w-10 @[280px]:h-12 @[280px]:w-12" />
        </motion.div>
      </div>
      <h3 className="mb-1 text-[11px] font-bold text-gray-900 @[180px]:text-xs @[220px]:mb-1.5 @[220px]:text-sm @[280px]:mb-2 @[280px]:text-base">
        AI 리포트 분석중...
      </h3>
      <p className="text-[9px] text-gray-500 @[180px]:text-[10px] @[220px]:text-xs @[280px]:text-sm">
        면접 영상을 분석하고 있습니다.
        <br />
        잠시만 기다려주세요.
      </p>
      <div className="mt-3 flex gap-1 @[180px]:mt-4 @[220px]:mt-5 @[280px]:mt-6">
        <motion.div
          className="h-1 w-1 rounded-full bg-yellow-500 @[180px]:h-1.5 @[180px]:w-1.5 @[220px]:h-2 @[220px]:w-2"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="h-1 w-1 rounded-full bg-yellow-500 @[180px]:h-1.5 @[180px]:w-1.5 @[220px]:h-2 @[220px]:w-2"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="h-1 w-1 rounded-full bg-yellow-500 @[180px]:h-1.5 @[180px]:w-1.5 @[220px]:h-2 @[220px]:w-2"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </div>
  )
}
