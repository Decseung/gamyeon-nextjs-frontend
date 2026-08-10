import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'
import styles from './CardFluid.module.css'

export function AnalysingCard() {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center text-center ${styles.statusInset}`}
    >
      <div className={`rounded-full bg-yellow-100 ${styles.statusBadge} ${styles.analysingBadge}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RotateCw className={`text-yellow-600 ${styles.statusIcon}`} />
        </motion.div>
      </div>
      <h3 className={`font-bold text-gray-900 ${styles.analysingTitle}`}>AI 리포트 분석중...</h3>
      <p className={`text-gray-500 ${styles.statusCopy}`}>
        면접 영상을 분석하고 있습니다.
        <br />
        잠시만 기다려주세요.
      </p>
      <div className={`flex ${styles.loadingDots}`}>
        <motion.div
          className={`rounded-full bg-yellow-500 ${styles.loadingDot}`}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className={`rounded-full bg-yellow-500 ${styles.loadingDot}`}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className={`rounded-full bg-yellow-500 ${styles.loadingDot}`}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </div>
  )
}
