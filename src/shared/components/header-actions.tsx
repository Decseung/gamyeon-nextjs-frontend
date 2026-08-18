import { NotifButton } from '@/featured/notif/components/NotifButton'
import { UserProfileButton } from '@/shared/components/user-profile-button'

export function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <NotifButton />
      <UserProfileButton />
    </div>
  )
}
