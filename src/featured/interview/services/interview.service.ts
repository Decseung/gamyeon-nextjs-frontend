import { ApiResponse, serverApi } from '@/shared/lib/api'
import {
  CompleteFileUploadResponse,
  CreateInterviewResponse,
  FileInfo,
  GetInterviewQuestionsResponse,
  IssuePresignedUrlRequest,
  IssuePresignedUrlResponse,
  IssueVideoPresignedUrlResponse,
  UpdateInterviewTitleResponse,
  IssueVideoPresignedUrlRequest,
  VideoInfo,
  CompleteVideoFileUploadResponse,
  AnswerAnalysisResponse,
  InterviewBatchPayload,
  RestartContextInterviewResponse,
} from '../types'

// 면접 생성(제목 추가)
export async function createInterview(
  title: string,
): Promise<ApiResponse<CreateInterviewResponse>> {
  return await serverApi.post('/api/v1/intvs', {
    title,
  })
}

// 면접 제목 수정
export async function updateInterviewTitle(
  intvId: number,
  title: string,
): Promise<ApiResponse<UpdateInterviewTitleResponse>> {
  return await serverApi.patch(`/api/v1/intvs/${intvId}`, {
    title,
  })
}

// 면접 문서 업로드 presignedUrl 발급
export async function issuePresignedUrl(
  intvId: number,
  resBody: IssuePresignedUrlRequest,
): Promise<ApiResponse<IssuePresignedUrlResponse>> {
  const { fileType, originalFileName, fileSizeBytes, contentType } = resBody
  return await serverApi.post(`/api/v1/preparations/${intvId}/files/presigned-url`, {
    fileType: fileType,
    originalFileName: originalFileName,
    fileSizeBytes: fileSizeBytes,
    contentType: contentType,
  })
}

// 면접 문서 업로드 완료
export async function completeFileUpload(
  intvId: number,
  files: FileInfo[],
): Promise<ApiResponse<CompleteFileUploadResponse>> {
  return await serverApi.post(`/api/v1/preparations/${intvId}/files`, {
    files: files,
  })
}

// 면접 질문 생성
export async function generateInterviewQuestion(intvId: number): Promise<ApiResponse<null>> {
  return await serverApi.post(`/api/v1/intvs/${intvId}/questions`)
}

// 면접 질문 조회
export async function getInterviewQuestions(
  intvId: number,
): Promise<ApiResponse<GetInterviewQuestionsResponse>> {
  return await serverApi.get(`/api/v1/intvs/${intvId}/questions`)
}

// 답변 영상 업로드 presignedUrl 발급
export async function issueVideoPresignedUrl(
  questionSetId: number,
  video: IssueVideoPresignedUrlRequest,
): Promise<ApiResponse<IssueVideoPresignedUrlResponse>> {
  return await serverApi.post(`/api/v1/intvs/${questionSetId}/answers/presigned-url`, video)
}

// 답변 영상 업로드 완료
export async function completeVideoFileUpload(
  questionSetId: number,
  intvId: number,
  video: VideoInfo,
): Promise<ApiResponse<CompleteVideoFileUploadResponse>> {
  return await serverApi.post(`/api/v1/intvs/${questionSetId}/answers`, {
    intvId,
    ...video,
  })
}

// 답변 분석 요청
export async function requestAnswerAnalysis(
  answerId: number,
): Promise<ApiResponse<AnswerAnalysisResponse>> {
  return await serverApi.post(`/api/v1/answers/${answerId}/analysis`)
}

// 면접 완료
export async function finishInterview(intvId: number): Promise<ApiResponse<null>> {
  return await serverApi.patch(`/api/v1/intvs/${intvId}/finish`)
}

// 시선/고개 통계 서버 전송
export async function sendGazeStats(questionSetId: number, payload: InterviewBatchPayload) {
  return await serverApi.post(`/api/v1/intvs/${questionSetId}/gaze`, payload)
}

// 면접 시작
export async function startInterview(intvId: number): Promise<ApiResponse<null>> {
  return await serverApi.patch(`/api/v1/intvs/${intvId}/start`)
}

// 면저 중단
export async function pauseInterview(intvId: number): Promise<ApiResponse<null>> {
  return await serverApi.patch(`/api/v1/intvs/${intvId}/pause`)
}

// 이어하기용 질문 컨텍스트 조회
export async function restartContextInterview(
  intvId: number,
): Promise<ApiResponse<RestartContextInterviewResponse>> {
  return await serverApi.get(`/api/v1/intvs/${intvId}/resume-context`)
}

// 면접 재개(이어하기)
export async function restartInterview(intvId: number): Promise<ApiResponse<null>> {
  return await serverApi.patch(`/api/v1/intvs/${intvId}/resume`)
}
