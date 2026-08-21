'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  House,
  LayoutDashboard,
  Video,
} from 'lucide-react'
import { InterviewStartGuideModal } from '@/featured/dashboard/components/InterviewStartGuideModal'
import { ResumeInterviewModal } from '@/featured/dashboard/components/ResumeInterviewModal'
import { InterviewReportItem } from '@/featured/history/types'

const navItems = [
  { icon: House, label: '가면 AI', href: '/' },
  { icon: LayoutDashboard, label: '대시보드', href: '/dashboard' },
  { icon: Megaphone, label: '공지사항', href: '/notices' },
  { icon: Video, label: '면접 시작', href: '/interview' },
  { icon: ClipboardList, label: '면접 기록', href: '/history' },
]

interface DashboardSidebarProps {
  pausedRecords: InterviewReportItem[]
}

export function DashboardSidebar({ pausedRecords }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isStartGuideModalOpen, setIsStartGuideModalOpen] = useState(false)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const pathname = usePathname()

  const hasPausedInterview = pausedRecords.length > 0

  const handleInterviewClick = (_event: React.MouseEvent<HTMLAnchorElement>) => {
    // TODO: 삭제 API 구현 후 팝업 활성화
    // if (!hasPausedInterview) return
    // _event.preventDefault()
    // setIsStartGuideModalOpen(true)
  }

  return (
    <div className="relative shrink-0">
      <motion.aside
        animate={{ width: collapsed ? 64 : 232 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="border-border/50 bg-background flex h-screen flex-col overflow-hidden border-r"
      >
        <div className="border-border/50 flex h-16 shrink-0 items-center border-b px-4">
          <Link href="/" aria-label="대시보드로 이동" className="flex cursor-pointer items-center">
            <div className="relative">
              <motion.div
                animate={{ opacity: collapsed ? 0 : 1 }}
                transition={{ duration: 0.15 }}
                style={{ pointerEvents: collapsed ? 'none' : 'auto' }}
              >
                <Image
                  src="/images/Gamyeon_Logo.png"
                  alt="Gamyeon logo"
                  width={1024}
                  height={768}
                  loading="eager"
                  style={{ height: '28px', width: 'auto' }}
                />
              </motion.div>
              <motion.div
                animate={{ opacity: collapsed ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-1/2 left-0 -translate-y-1/2"
                style={{ pointerEvents: collapsed ? 'auto' : 'none' }}
              >
                <Image
                  src="/images/Gamyeon_Logo.svg"
                  alt="Gamyeon logo"
                  width={1024}
                  height={768}
                  style={{ height: '32px', width: 'auto' }}
                />
              </motion.div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navItems.map((item) => {
            const active = pathname === item.href
            const isInterviewItem = item.href === '/interview'

            const linkEl = (
              <Link
                href={item.href}
                onClick={isInterviewItem ? handleInterviewClick : undefined}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.16 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkEl}</div>
          })}
        </nav>
      </motion.aside>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-4 -right-3 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full shadow-sm transition-colors"
        aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <InterviewStartGuideModal
        open={isStartGuideModalOpen}
        onClose={() => setIsStartGuideModalOpen(false)}
        onResume={() => setIsResumeModalOpen(true)}
        pausedRecords={pausedRecords}
      />
      <ResumeInterviewModal
        open={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        pausedRecords={pausedRecords}
      />
    </div>
  )
}
