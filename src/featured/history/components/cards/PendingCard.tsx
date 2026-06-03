import Link from 'next/link'
import { RotateCw } from 'lucide-react'

interface PendingCardProps {
  intvId: number
}

export function PendingCard({ intvId }: PendingCardProps) {
  return (
    <Link
      href={`/interview?restart=true&id=${intvId}`}
      onClick={(e) => e.stopPropagation()}
      className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center @[180px]:gap-3 @[180px]:p-4 @[220px]:gap-4 @[220px]:p-5 @[280px]:gap-6 @[280px]:p-6"
    >
      <div className="rounded-full bg-linear-to-br from-green-100 to-emerald-100 p-3 @[180px]:p-4 @[220px]:p-5 @[280px]:p-6">
        <RotateCw className="h-6 w-6 text-green-600 @[180px]:h-8 @[180px]:w-8 @[220px]:h-10 @[220px]:w-10 @[280px]:h-12 @[280px]:w-12" />
      </div>
      <div>
        <h3 className="mb-0.5 text-xs font-bold text-gray-900 @[180px]:mb-1 @[180px]:text-sm @[220px]:text-base @[280px]:text-xl">
          이어하기
        </h3>
        <p className="text-[9px] text-gray-500 @[180px]:text-[10px] @[220px]:text-xs @[280px]:text-sm">
          중단된 면접을 계속 진행하세요
        </p>
      </div>
    </Link>
  )
}
