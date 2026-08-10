import Link from 'next/link'
import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'
import styles from './CardFluid.module.css'

interface PendingCardProps {
  intvId: number
  title: string
}

export function PendingCard({ intvId, title }: PendingCardProps) {
  return (
    <motion.div whileHover="hover" className="h-full">
      <Link
        href={`/interview?restart=true&id=${intvId}`}
        className={`flex h-full flex-col items-center justify-center text-center ${styles.statusLayout}`}
        onClick={() => sessionStorage.setItem('interviewFrom', 'history')}
      >
        <div
          className={`rounded-full bg-linear-to-br from-green-100 to-emerald-100 ${styles.statusBadge}`}
        >
          <motion.div
            variants={{ hover: { rotate: 360 } }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <RotateCw className={`text-green-600 ${styles.statusIcon}`} />
          </motion.div>
        </div>
        <div className="w-full min-w-0">
          <p className={`mb-0.5 line-clamp-1 font-medium text-gray-400 ${styles.statusEyebrow}`}>
            {title}
          </p>
          <h3 className={`font-bold text-gray-900 ${styles.statusTitle}`}>이어하기</h3>
          <p className={`text-gray-500 ${styles.statusCopy}`}>중단된 면접을 계속 진행하세요</p>
        </div>
      </Link>
    </motion.div>
  )
}
