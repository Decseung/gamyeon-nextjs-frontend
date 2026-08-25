'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { logoutAction } from '@/featured/auth/actions/auth.action'
import { useAuthStore } from '@/featured/auth/store'
import { clearNotifClientSession } from '@/featured/notif/hooks/notifClientSession'

export function ReportHeader() {
  const { user, logout: clearAuthStore } = useAuthStore()
  const router = useRouter()
  const initials = user?.nickname ? user.nickname.slice(0, 1) : 'U'

  const handleLogout = async () => {
    clearNotifClientSession()

    try {
      await logoutAction()
    } finally {
      clearAuthStore()
      router.push('/signin')
    }
  }

  return (
    <header className="border-border/50 bg-background/80 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/images/Gamyeon_Logo.png"
            alt="Gamyeon logo"
            width={1024}
            height={768}
            style={{ height: '32px', width: 'auto' }}
          />
        </Link>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="ring-primary/40 flex cursor-pointer items-center rounded-full transition outline-none hover:ring-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.nickname ?? '사용자'}</p>
              <p className="text-muted-foreground truncate text-xs">{user?.email ?? ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer gap-2">
                <LayoutDashboard className="h-4 w-4" />
                대시보드
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Settings className="h-4 w-4" />
              설정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer gap-2"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
