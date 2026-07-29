'use client'

import { Switch } from '@/shared/ui/switch'
import { useSettingsStore } from '../store'
import { SETTINGS_COPY } from '../constants'
import { useSettingsHydrated } from '../hooks/useSettingsHydrated'
import { SettingsRow } from './SettingsRow'

export function NotificationSection() {
  const { notificationEnabled, setNotificationEnabled } = useSettingsStore()
  const isHydrated = useSettingsHydrated()

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{SETTINGS_COPY.notificationTitle}</h3>
      <SettingsRow label="알림 받기" description="공지사항과 리포트 완료 소식을 알려드립니다.">
        <Switch
          checked={isHydrated ? notificationEnabled : true}
          disabled={!isHydrated}
          onCheckedChange={setNotificationEnabled}
          aria-label="알림 받기"
        />
      </SettingsRow>
      <p className="text-muted-foreground text-xs">{SETTINGS_COPY.localOnlyNotice}</p>
    </section>
  )
}
