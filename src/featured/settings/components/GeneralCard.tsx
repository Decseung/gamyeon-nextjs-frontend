import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { SETTINGS_COPY } from '../constants'
import { AppearanceSection } from './AppearanceSection'
import { NotificationSection } from './NotificationSection'

export function GeneralCard() {
  return (
    <Card className="py-8">
      <CardHeader>
        <CardTitle>{SETTINGS_COPY.sectionGeneral}</CardTitle>
        <CardDescription>{SETTINGS_COPY.sectionGeneralDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <AppearanceSection />
        <Separator />
        <NotificationSection />
      </CardContent>
    </Card>
  )
}
