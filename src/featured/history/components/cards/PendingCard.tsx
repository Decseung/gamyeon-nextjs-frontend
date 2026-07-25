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
        className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center @[180px]:gap-3 @[180px]:p-4 @[220px]:gap-4 @[220px]:p-5 @[280px]:gap-6 @[280px]:p-6"
        onClick={() => sessionStorage.setItem('interviewFrom', 'history')}
      >
        <div className="rounded-full bg-linear-to-br from-green-100 to-emerald-100 p-3 @[180px]:p-4 @[220px]:p-5 @[280px]:p-6">
          <motion.div
            variants={{ hover: { rotate: 360 } }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <RotateCw className="h-6 w-6 text-green-600 @[180px]:h-8 @[180px]:w-8 @[220px]:h-10 @[220px]:w-10 @[280px]:h-12 @[280px]:w-12" />
          </motion.div>
        </div>
        <div>
          <p className="mb-0.5 line-clamp-1 text-[9px] font-medium text-gray-400 @[180px]:text-[10px] @[220px]:text-xs @[280px]:text-sm">
            {title}
          </p>
          <h3 className="mb-0.5 text-xs font-bold text-gray-900 @[180px]:mb-1 @[180px]:text-sm @[220px]:text-base @[280px]:text-xl">
            이어하기
          </h3>
          <p className="text-[9px] text-gray-500 @[180px]:text-[10px] @[220px]:text-xs @[280px]:text-sm">
            중단된 면접을 계속 진행하세요
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
