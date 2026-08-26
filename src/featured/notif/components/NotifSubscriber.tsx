'use client'

import { useNotifSubscription, type NotifUnauthorizedBehavior } from '../hooks/useNotifSubscription'

interface NotifSubscriberProps {
  unauthorizedBehavior?: NotifUnauthorizedBehavior
}

export function NotifSubscriber({
  unauthorizedBehavior = 'redirect-to-signin',
}: NotifSubscriberProps = {}) {
  useNotifSubscription({ unauthorizedBehavior })

  return null
}
