'use client'

import { useState } from 'react'
import { type InterviewFileType } from '@/featured/interview/types'
import {
  completeFileUploadAction,
  generateInterviewQuestionAction,
  issuePresignedUrlAction,
} from '@/featured/interview/actions/interview.action'
import uploadFileToS3 from '@/shared/lib/utils/uploadFileToS3'
import { toast } from 'sonner'
import { trackEvent } from '@/shared/lib/utils/analytics'

interface UseDocumentUploadParams {
  interviewId: number | null
  completeStep: (step: number) => void
  setIsStep2Locked: (locked: boolean) => void
}

export function useDocumentUpload({
  interviewId,
  completeStep,
  setIsStep2Locked,
}: UseDocumentUploadParams) {
  const [resume, setResume] = useState<File | null>(null)
  const [portfolio, setPortfolio] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleDocumentConfirm = async () => {
    if (!interviewId || !resume) return

    try {
      setIsUploading(true)
      const uploadTargets: Array<{ file: File | null; type: InterviewFileType }> = [
        { file: resume, type: 'RESUME' },
        { file: portfolio, type: 'PORTFOLIO' },
        { file: coverLetter, type: 'COVER_LETTER' },
      ]
      const uploadedFiles: Array<{
        fileType: InterviewFileType
        originalFileName: string
        fileKey: string
        fileUrl: string
      }> = []

      for (const target of uploadTargets) {
        if (!target.file) continue

        const urlRes = await issuePresignedUrlAction(interviewId, {
          fileType: target.type,
          originalFileName: target.file.name,
          fileSizeBytes: target.file.size,
          contentType: 'application/pdf',
        })

        if (!urlRes.success || !urlRes.data) {
          throw new Error(urlRes.message || `${target.type} presigned URL 발급 실패`)
        }

        const { presignedUrl, fileType, originalFileName, fileKey, fileUrl } = urlRes.data
        const s3Res = await uploadFileToS3(target.file, presignedUrl)

        if (!s3Res.success) {
          throw new Error(`${target.type} S3 업로드 실패`)
        }

        trackEvent('upload_s3_success', { category: 'interview_setup' })
        uploadedFiles.push({ fileType, originalFileName, fileKey, fileUrl })
      }

      if (uploadedFiles.length === 0) {
        toast.error('업로드할 파일이 없습니다.')
      }

      const completeRes = await completeFileUploadAction(interviewId, { files: uploadedFiles })
      if (!completeRes.success) {
        toast.error(completeRes.message || '파일 업로드 완료 처리 실패')
        return
      }

      completeStep(2)
      setIsStep2Locked(true)

      trackEvent('question_gen_start', { category: 'user_interview' })
      generateInterviewQuestionAction(interviewId).catch((err) => console.error(err))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '문서 업로드 중 오류 발생'
      trackEvent('upload_s3_error', { category: 'interview_setup' })
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return {
    resume,
    setResume,
    portfolio,
    setPortfolio,
    coverLetter,
    setCoverLetter,
    isUploading,
    handleDocumentConfirm,
  }
}
