'use client'

import { Button } from '@/shared/ui/button'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { SETTINGS_COPY, THEME_OPTIONS } from '../constants'
import { SettingsRow } from './SettingsRow'

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{SETTINGS_COPY.appearanceTitle}</h3>
      <SettingsRow label="테마">
        <div className="border-border flex gap-1 rounded-lg border p-1">
          {THEME_OPTIONS.map((option) => {
            const isSelected = mounted && theme === option.value

            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 cursor-pointer px-3 text-xs"
                aria-pressed={isSelected}
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </SettingsRow>
    </section>
  )
}
