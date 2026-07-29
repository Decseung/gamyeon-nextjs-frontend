import type { ReactNode } from 'react'
import { AuthStoreHydrator } from '@/featured/auth/components/AuthStoreHydrator'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return <AuthStoreHydrator>{children}</AuthStoreHydrator>
}
