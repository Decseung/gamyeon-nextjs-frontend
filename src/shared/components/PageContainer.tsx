import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'wide:max-w-[1440px] wide:px-10 mx-auto w-full px-4 lg:px-6 xl:px-8',
        className,
      )}
      {...props}
    />
  )
}
