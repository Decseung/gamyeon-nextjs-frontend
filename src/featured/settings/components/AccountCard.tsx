import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { SETTINGS_COPY } from '../constants'
import { ProfileSection } from './ProfileSection'
import { AccountManagementSection } from './AccountManagementSection'

export function AccountCard() {
  return (
    <Card className="py-8">
      <CardHeader>
        <CardTitle>{SETTINGS_COPY.sectionAccount}</CardTitle>
        <CardDescription>{SETTINGS_COPY.sectionAccountDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ProfileSection />
        <Separator />
        <AccountManagementSection />
      </CardContent>
    </Card>
  )
}
