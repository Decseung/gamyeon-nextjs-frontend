import { ElementType } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { ArrowRight } from 'lucide-react'

export interface QuickStartCardProps {
  title: string
  description: string
  icon: ElementType
  iconStyle?: string
  iconColorStyle?: string
  href: string
  buttonText: string
  buttonTextStyle?: string
  hoverBorderStyle?: string
  isRecommended?: boolean
  isDisabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

export function QuickStartCard({
  title,
  description,
  icon: Icon,
  iconStyle = 'bg-primary/10 text-primary group-hover:bg-primary/20',
  iconColorStyle = 'text-primary',
  href,
  buttonText,
  isRecommended = false,
  isDisabled = false,
  onClick,
  buttonTextStyle = 'text-primary',
  hoverBorderStyle = 'hover:border-primary/30 hover:shadow-primary/5',
}: QuickStartCardProps) {
  const CardContainer = (
    <Card
      className={`group flex h-full flex-col transition-all ${
        isDisabled
          ? 'border-border/50 cursor-not-allowed bg-slate-50'
          : `border-border/50 cursor-pointer hover:shadow-md ${hoverBorderStyle}`
      } ${!isDisabled && isRecommended ? 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:shadow-primary/10' : ''}`}
    >
      <CardContent className="flex flex-1 flex-col p-5">
        <div
          className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isDisabled ? 'bg-slate-200/50 text-slate-400' : iconStyle
          }`}
        >
          <Icon className={`h-5 w-5 ${isDisabled ? 'text-slate-400' : iconColorStyle}`} />
        </div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className={`font-semibold ${isDisabled ? 'text-slate-400' : ''}`}>{title}</h3>
          {!isDisabled && isRecommended && (
            <Badge className="bg-primary/10 text-primary px-1.5 py-0 text-[10px]">추천</Badge>
          )}
        </div>
        <p
          className={`flex-1 text-xs leading-relaxed ${isDisabled ? 'text-slate-400 opacity-60' : 'text-muted-foreground'}`}
        >
          {description}
        </p>
        <div
          className={`mt-4 flex shrink-0 items-center gap-1 text-xs font-medium ${
            isDisabled ? 'text-slate-400' : buttonTextStyle
          }`}
        >
          {buttonText} <ArrowRight className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  )

  if (isDisabled) {
    return (
      <div className="h-full w-full" aria-disabled={true}>
        {CardContainer}
      </div>
    )
  }

  return (
    <Link href={href} onClick={onClick} className="block h-full w-full">
      {CardContainer}
    </Link>
  )
}
