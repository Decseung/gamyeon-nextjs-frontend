import { FaceDetector, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export interface VisionModels {
  landmarker: FaceLandmarker
  detector: FaceDetector
}

// Keep model ownership outside component lifecycles so setup and interview can reuse it.
let cachedModels: VisionModels | null = null
let initializationPromise: Promise<VisionModels> | null = null

export function getCachedVisionModels(): VisionModels | null {
  return cachedModels
}

async function createVisionModels(): Promise<VisionModels> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
  )

  // Wait for both tasks, including a late success after the other task fails,
  // so every instance from an unsuccessful attempt can be released.
  const [landmarker, detector] = await Promise.allSettled([
    FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: '/models/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFacialTransformationMatrixes: true,
    }),
    FaceDetector.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: '/models/face_detector.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
    }),
  ])

  if (landmarker.status === 'rejected') {
    if (detector.status === 'fulfilled') detector.value.close()
    throw landmarker.reason
  }

  if (detector.status === 'rejected') {
    landmarker.value.close()
    throw detector.reason
  }

  return { landmarker: landmarker.value, detector: detector.value }
}

export function getVisionModels(): Promise<VisionModels> {
  if (cachedModels) return Promise.resolve(cachedModels)

  if (!initializationPromise) {
    initializationPromise = createVisionModels()
      .then((models) => {
        cachedModels = models
        return models
      })
      .catch((error: unknown) => {
        console.error('두 모델 초기화 실패:', error)
        throw error
      })
      .finally(() => {
        // Only the loader resets the shared promise, rather than each subscriber.
        initializationPromise = null
      })
  }

  return initializationPromise
}
