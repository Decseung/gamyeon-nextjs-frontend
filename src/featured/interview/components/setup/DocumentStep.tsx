import { FolderOpen, ChevronRight, CheckCircle2, Upload, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useEffect } from 'react'
import { trackFunnel } from '@/shared/lib/utils/analytics'
interface DocumentStepProps {
  resume: File | null
  portfolio: File | null
  coverLetter: File | null
  setResume: (f: File | null) => void
  setPortfolio: (f: File | null) => void
  setCoverLetter: (f: File | null) => void
  onComplete: () => void
  isUploading: boolean
}

export function DocumentStep({
  resume,
  portfolio,
  coverLetter,
  setResume,
  setPortfolio,
  setCoverLetter,
  onComplete,
  isUploading,
}: DocumentStepProps) {
  // GA4 이벤트 전송 코드 수정 (중복 제거 및 단축키 사용)
  useEffect(() => {
    trackFunnel('enter_upload_step')
  }, [])

  const canComplete = !!resume
  const handleFileChange =
    (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        alert('PDF 파일만 업로드 가능합니다.')
        e.target.value = ''
        return
      }

      setter(file)
    }
  const docs = [
    { label: '(필수) 이력서', type: 'RESUME', file: resume, setter: setResume },
    { label: '(선택) 포트폴리오', type: 'PORTFOLIO', file: portfolio, setter: setPortfolio },
    { label: '(선택) 자기소개서', type: 'COVER_LETTER', file: coverLetter, setter: setCoverLetter },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
          <FolderOpen className="text-primary h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold">문서 업로드</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          이력서, 포트폴리오, 자기소개서를 업로드하면 AI가 맞춤 질문을 준비합니다.
        </p>
      </div>
      <div className="space-y-2">
        {docs.map(({ label, file, setter }) => (
          <div key={label}>
            {file ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-green-50 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span className="flex-1 truncate text-sm font-medium text-green-700">
                  {file.name}
                </span>
                <button
                  onClick={() => setter(null)}
                  className="shrink-0 text-green-400 transition-colors hover:text-green-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-border hover:bg-muted/30 flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-4 py-2.5 transition-colors">
                <Upload className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <span className="text-muted-foreground text-sm">
                  {label} 업로드 <span className="text-gray-300">(.pdf 파일만 가능)</span>
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange(setter)}
                />
              </label>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          disabled={!canComplete || isUploading}
          className="cursor-pointer gap-2"
          onClick={onComplete}
        >
          {isUploading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              업로드 중
            </>
          ) : (
            <>
              완료
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
