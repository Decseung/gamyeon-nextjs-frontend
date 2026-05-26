import { motion } from 'framer-motion'
import { CheckCircle2, Video, Mic, FileText, FolderOpen } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { type StepStatus } from '@/featured/interview/types'

const STEPS = [
  { id: 1, label: '면접 제목', icon: FileText },
  { id: 2, label: '문서 업로드', icon: FolderOpen },
  { id: 3, label: '카메라 권한', icon: Video },
  { id: 4, label: '마이크 권한', icon: Mic },
] as const

interface SidebarStepProps {
  step: (typeof STEPS)[number]
  status: StepStatus
  onClick?: () => void
  freeNavigation?: boolean
  locked?: boolean
}

function SidebarStep({ step, status, onClick, freeNavigation, locked }: SidebarStepProps) {
  const Icon = step.icon
  const clickable = (status === 'done' || freeNavigation) && !!onClick && !locked
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
        status === 'active' && 'bg-primary/10',
        status === 'pending' && !freeNavigation && 'opacity-40',
        clickable && 'hover:bg-muted/60 cursor-pointer',
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold',
              status === 'active'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/30 text-muted-foreground/50',
            )}
          >
            {step.id}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            status === 'active'
              ? 'text-primary'
              : status === 'done'
                ? 'text-green-500'
                : 'text-muted-foreground/50',
          )}
        />
        <span
          className={cn(
            'text-sm font-medium',
            status === 'active' && 'text-primary',
            status === 'done' && 'text-foreground',
            status === 'pending' && 'text-muted-foreground',
          )}
        >
          {step.label}
        </span>
      </div>
    </div>
  )
}

interface SetupSidebarProps {
  statuses: StepStatus[]
  doneCount: number
  onStepClick?: (step: number) => void
  freeNavigation?: boolean
  lockedSteps?: number[]
}

export function SetupSidebar({
  statuses,
  doneCount,
  onStepClick,
  freeNavigation,
  lockedSteps,
}: SetupSidebarProps) {
  return (
    <aside className="border-border/60 bg-muted/30 flex w-64 shrink-0 flex-col border-r">
      <div className="border-border/50 border-b px-5 py-5">
        <p className="text-sm leading-tight font-bold">면접 환경 설정</p>
        <p className="text-muted-foreground mt-1 text-xs">{doneCount} / 4 단계 완료</p>
        <div className="bg-border mt-3 h-1 overflow-hidden rounded-full">
          <motion.div
            className="bg-primary h-full rounded-full"
            animate={{ width: `${(doneCount / 4) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {STEPS.map((step) => (
          <SidebarStep
            key={step.id}
            step={step}
            status={statuses[step.id - 1]}
            onClick={onStepClick ? () => onStepClick(step.id) : undefined}
            freeNavigation={freeNavigation}
            locked={lockedSteps?.includes(step.id)}
          />
        ))}
      </nav>
    </aside>
  )
}
