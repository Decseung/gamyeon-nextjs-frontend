import { FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

interface TitleStepProps {
  title: string
  onChange: (value: string) => void
  onConfirm: () => void
}

export function TitleStep({ title, onChange, onConfirm }: TitleStepProps) {
  const trimmedTitle = title.trim()
  const isValidTitle = /^[가-힣a-zA-Z0-9 ]{1,20}$/.test(trimmedTitle)

  return (
    <div className="space-y-6">
      <div>
        <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
          <FileText className="text-primary h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold">면접 제목 입력</h3>
        <p className="text-muted-foreground mt-1 text-sm">이번 면접의 제목을 입력해주세요.</p>
        <span className="text-muted-foreground text-xs">
          (공백을 포함한 한글, 영어, 숫자 1~20자만 입력 가능합니다.)
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="예: 원티드 면접"
          value={title}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValidTitle && onConfirm()}
          autoFocus
          className="flex-1 focus-visible:border-0 focus-visible:ring-offset-0 focus-visible:outline-none"
        />
        <Button
          disabled={!isValidTitle}
          onClick={onConfirm}
          className="shrink-0 cursor-pointer gap-1"
        >
          확인
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
