import { NotifSubscriber } from '@/featured/notif/components/NotifSubscriber'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotifSubscriber />
      {children}
    </>
  )
}
