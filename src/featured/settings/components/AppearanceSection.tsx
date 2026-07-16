import { Button } from '@/shared/ui/button'
import { SETTINGS_COPY, THEME_OPTIONS } from '../constants'
import { SettingsRow } from './SettingsRow'

export function AppearanceSection() {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{SETTINGS_COPY.appearanceTitle}</h3>
      <SettingsRow label="테마">
        <div className="border-border flex gap-1 rounded-lg border p-1">
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={option.value === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 cursor-pointer px-3 text-xs disabled:pointer-events-auto"
              disabled
            >
              {option.label}
            </Button>
          ))}
        </div>
      </SettingsRow>
      <p className="text-muted-foreground text-xs">{SETTINGS_COPY.themePending}</p>
    </section>
  )
}
