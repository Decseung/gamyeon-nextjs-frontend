'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useAuthStore } from '@/featured/auth/store'
import { logoutAction } from '@/featured/auth/actions/auth.action'
import { invalidateNotifSession } from '@/featured/notif/hooks/useNotifActions'
import { disconnectNotifsImmediately } from '@/featured/notif/services/notif.sse.service'
import { useNotifStore } from '@/featured/notif/store'
import { LayoutDashboard, LogOut, Settings } from 'lucide-react'

export function UserProfileButton() {
  const { user, logout: clearAuthStore } = useAuthStore()
  const router = useRouter()
  const initials = user?.nickname ? user.nickname.slice(0, 1) : 'U'

  const handleLogout = async () => {
    disconnectNotifsImmediately()
    invalidateNotifSession()
    useNotifStore.getState().resetNotifs()

    try {
      await logoutAction()
    } finally {
      clearAuthStore()
      router.push('/signin')
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="프로필 메뉴"
          className="ring-primary/40 flex cursor-pointer items-center rounded-full transition outline-none hover:ring-2"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="border-border/50 mb-1 border-b px-3 py-2">
          <p className="text-sm font-medium">{user?.nickname ?? '사용자'}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.email ?? ''}</p>
        </div>
        <DropdownMenuItem className="cursor-pointer gap-2">
          <LayoutDashboard className="h-4 w-4" />
          대시보드
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer gap-2">
            <Settings className="h-4 w-4" />
            설정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer gap-2"
          onClick={handleLogout}
        >
          <LogOut className="text-destructive h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
