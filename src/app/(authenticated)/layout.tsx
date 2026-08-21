import type { ReactNode } from 'react'
import { AuthStoreHydrator } from '@/featured/auth/components/AuthStoreHydrator'
import { NotifSubscriber } from '@/featured/notif/components/NotifSubscriber'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <AuthStoreHydrator>
      <NotifSubscriber />
      {children}
    </AuthStoreHydrator>
  )
}
