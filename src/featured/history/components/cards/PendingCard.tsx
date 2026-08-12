import Link from 'next/link'
import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'

interface PendingCardProps {
  intvId: number
  title: string
}

export function PendingCard({ intvId, title }: PendingCardProps) {
  return (
    <motion.div whileHover="hover" className="h-full">
      <Link
        href={`/interview?restart=true&id=${intvId}`}
        className="flex h-full flex-col items-center justify-center gap-4 p-5 text-center @[280px]:gap-6 @[280px]:p-8"
        onClick={() => sessionStorage.setItem('interviewFrom', 'history')}
      >
        <div className="rounded-full bg-linear-to-br from-green-100 to-emerald-100 p-5 @[280px]:p-8">
          <motion.div
            variants={{ hover: { rotate: 360 } }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <RotateCw className="h-8 w-8 text-green-600 @[280px]:h-12 @[280px]:w-12" />
          </motion.div>
        </div>
        <div className="w-full min-w-0">
          <p className="mb-0.5 line-clamp-1 text-xs font-medium text-gray-400 @[280px]:text-sm">
            {title}
          </p>
          <h3 className="mb-0.5 text-base font-bold text-gray-900 @[280px]:mb-1 @[280px]:text-xl">
            이어하기
          </h3>
          <p className="text-xs text-gray-500 @[280px]:text-sm">중단된 면접을 계속 진행하세요</p>
        </div>
      </Link>
    </motion.div>
  )
}
