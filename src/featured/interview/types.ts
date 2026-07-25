export type Phase = 'ready' | 'thinking' | 'answering' | 'transition' | 'finished'
export type StepStatus = 'pending' | 'active' | 'done'
export type PermStatus = 'idle' | 'requesting' | 'granted' | 'denied'
export type RecordingStatus = 'idle' | 'recording' | 'recorded'
export type InterviewFileType = 'RESUME' | 'PORTFOLIO' | 'COVER_LETTER'

export interface InterviewSetupConfig {
  title: string
  basePose: { pitch: number; yaw: number } | null
  stream: MediaStream | null
  interviewId: number | null
  questions: InterviewQuestions[]
}

export type FocusState =
  | 'CENTER'
  | 'LEFT'
  | 'RIGHT'
  | 'TOP'
  | 'BOTTOM'
  | 'TOP-LEFT'
  | 'TOP-RIGHT'
  | 'BOTTOM-LEFT'
  | 'BOTTOM-RIGHT'

export interface RawGazeData {
  offset_ms: number
  confidence: number
  gaze: {
    left: {
      x: number
      y: number
    }
    right: {
      x: number
      y: number
    }
  }
  head: {
    pitch: number
    yaw: number
    roll: number
  }
}

export interface GazeEvent {
  type: 'AWAY_START' | 'AWAY_END'
  offset_ms: number
  direction: FocusState
}

export interface InterviewBatchPayload {
  meta: {
    intvId: number
    questionSetId: number
    timestamp: number
    segmentSequence: number
  }
  metrics_summary: {
    average_concentration: number
    blink_count: number
    is_away_detected: boolean
  }
  raw_data: RawGazeData[]
  events: GazeEvent[]
}

export interface CreateInterviewResponse {
  intvId: number
  title: string
  status: string
}

export interface UpdateInterviewTitleResponse {
  intvId: number
  title: string
  status: string
}

export interface FileInfo {
  fileType: string
  originalFileName: string
  fileKey: string
  fileUrl: string
}

export interface IssuePresignedUrlRequest {
  fileType: InterviewFileType
  originalFileName: string
  contentType: string
  fileSizeBytes: number
}

export interface IssuePresignedUrlResponse {
  preparationId: number
  fileType: InterviewFileType
  originalFileName: string
  fileKey: string
  presignedUrl: string
  fileUrl: string
  expiresInSeconds: number
}

export type PreparationStatusType = 'READY'

export interface CompleteFileUploadResponse {
  preparationId: number
  preparationStatus: PreparationStatusType
}

export interface InterviewQuestions {
  questionSetId: number
  content: string
}

export interface GetInterviewQuestionsResponse {
  intvId: number
  questions: InterviewQuestions[]
}

export interface IssueVideoPresignedUrlRequest {
  originalFileName: string
  contentType: string
  fileSizeBytes: number
}

export interface IssueVideoPresignedUrlResponse {
  questionSetId: number
  originalFileName: string
  fileKey: string
  presignedUrl: string
  fileUrl: string
  expiresInSeconds: number
}

export interface VideoInfo {
  originalFileName: string
  fileKey: string
  fileUrl: string
  contentType: string
  fileSizeBytes: number
}

export interface CompleteVideoFileUploadResponse {
  answerId: number
  questionSetId: number
}

export interface AnswerAnalysisResponse {
  answerId: number
  analysisStatus: string
}

export interface uploadAnswer {
  videoBlob: Blob
  questionSetId: number
  interviewId: number
}

export type AnswerStatus =
  | 'UPLOADED'
  | 'STT_PENDING'
  | 'STT_PROCESSING'
  | 'STT_COMPLETED'
  | 'STT_FAILED'
  | null

export type InterviewStatus = 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED'

export interface Question {
  questionSetId: number
  questionOrder: number
  content: string
  answered: boolean
  answerId: number | null
  answerStatus: AnswerStatus
}

export interface RestartContextInterviewResponse {
  intvId: number
  status: InterviewStatus
  totalQuestionCount: number
  answeredCount: number
  completed: boolean
  nextQuestionSetId: number | null
  nextQuestionOrder: number | null
  nextQuestionContent: string | null
  questions: Question[]
}
