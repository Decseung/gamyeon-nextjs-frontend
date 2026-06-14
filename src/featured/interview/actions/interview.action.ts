'use server'

import { ApiResponse } from '@/shared/lib/api'
import {
  CompleteFileUploadResponse,
  CreateInterviewResponse,
  FileInfo,
  GetInterviewQuestionsResponse,
  IssuePresignedUrlRequest,
  IssuePresignedUrlResponse,
  UpdateInterviewTitleResponse,
  IssueVideoPresignedUrlRequest,
  VideoInfo,
  CompleteVideoFileUploadResponse,
  IssueVideoPresignedUrlResponse,
  AnswerAnalysisResponse,
  InterviewBatchPayload,
  RestartContextInterviewResponse,
} from '../types'
import {
  completeFileUpload,
  completeVideoFileUpload,
  createInterview,
  finishInterview,
  generateInterviewQuestion,
  getInterviewQuestions,
  issuePresignedUrl,
  issueVideoPresignedUrl,
  pauseInterview,
  requestAnswerAnalysis,
  restartContextInterview,
  restartInterview,
  sendGazeStats,
  startInterview,
  updateInterviewTitle,
} from '@/featured/interview/services/interview.service'
import { withAction } from '@/shared/lib/withAction'
import { validateFileSize } from '@/featured/interview/utils/validateFileUpload'

// 면접 생성(제목 추가)
export async function createInterviewAction(
  title: string,
): Promise<ApiResponse<CreateInterviewResponse>> {
  return withAction(() => createInterview(title))
}

// 면접 제목 수정
export async function updateInterviewTitleAction(
  intvId: number,
  title: string,
): Promise<ApiResponse<UpdateInterviewTitleResponse>> {
  return withAction(() => updateInterviewTitle(intvId, title))
}

// 면접 문서 업로드 presignedUrl 발급
export async function issuePresignedUrlAction(
  intvId: number,
  resBody: IssuePresignedUrlRequest,
): Promise<ApiResponse<IssuePresignedUrlResponse>> {
  const { fileType, fileSizeBytes } = resBody
  const validation = validateFileSize(fileType, fileSizeBytes)
  if (!validation.valid) {
    return {
      success: false,
      code: '',
      message: validation.message || '파일 업로드 조건에 맞지 않습니다.',
      data: null,
    }
  }
  return withAction(() => issuePresignedUrl(intvId, resBody))
}

// 면접 문서 업로드 완료
export async function completeFileUploadAction(
  intvId: number,
  { files }: { files: FileInfo[] },
): Promise<ApiResponse<CompleteFileUploadResponse>> {
  if (!files || files.length === 0) {
    return {
      success: false,
      message: '업로드된 파일 정보가 없습니다.',
      code: '',
      data: null,
    }
  }
  return withAction(() => completeFileUpload(intvId, files))
}

// 면접 질문 생성
export async function generateInterviewQuestionAction(intvId: number): Promise<ApiResponse<null>> {
  return withAction(() => generateInterviewQuestion(intvId))
}

// 면접 질문 조회
export async function getInterviewQuestionsAction(
  intvId: number,
): Promise<ApiResponse<GetInterviewQuestionsResponse>> {
  return withAction(() => getInterviewQuestions(intvId))
}

// 답변 영상 업로드 presignedUrl 발급
export async function issueVideoPresignedUrlAction(
  questionSetId: number,
  video: IssueVideoPresignedUrlRequest,
): Promise<ApiResponse<IssueVideoPresignedUrlResponse>> {
  return withAction(() => issueVideoPresignedUrl(questionSetId, video))
}

// 답변 영상 업로드 완료
export async function completeVideoFileUploadAction(
  questionSetId: number,
  intvId: number,
  video: VideoInfo,
): Promise<ApiResponse<CompleteVideoFileUploadResponse>> {
  return withAction(() => completeVideoFileUpload(questionSetId, intvId, video))
}

// 답변 분석 요청
export async function requestAnswerAnalysisAction(
  answerId: number,
): Promise<ApiResponse<AnswerAnalysisResponse>> {
  return withAction(() => requestAnswerAnalysis(answerId))
}

// 면접 완료
export async function finishInterviewAction(intvId: number): Promise<ApiResponse<null>> {
  return withAction(() => finishInterview(intvId))
}

// 시선/고개 통계 서버 전송
export async function sendGazeStatsAction(questionSetId: number, payload: InterviewBatchPayload) {
  return withAction(() => sendGazeStats(questionSetId, payload))
}

// 면접 시작
export async function startInterviewAction(intvId: number): Promise<ApiResponse<null>> {
  return withAction(() => startInterview(intvId))
}

// 면접 중단
export async function pauseInterviewAction(intvId: number): Promise<ApiResponse<null>> {
  return withAction(() => pauseInterview(intvId))
}

// 이어하기용 질문 컨텍스트 조회
export async function restartContextInterviewAction(
  intvId: number,
): Promise<ApiResponse<RestartContextInterviewResponse>> {
  return withAction(() => restartContextInterview(intvId))
}

// 면접 재개(이어하기)
export async function restartInterviewAction(intvId: number): Promise<ApiResponse<null>> {
  return withAction(() => restartInterview(intvId))
}
