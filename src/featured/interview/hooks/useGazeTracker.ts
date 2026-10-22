import { useEffect, useState } from 'react'
import {
  getCachedVisionModels,
  getVisionModels,
  type VisionModels,
} from '@/featured/interview/lib/visionModels'

export const useGazeTracker = () => {
  const [models, setModels] = useState<VisionModels | null>(getCachedVisionModels)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    getVisionModels()
      .then((loadedModels) => {
        if (!cancelled) setModels(loadedModels)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { landmarker: models?.landmarker ?? null, detector: models?.detector ?? null, error }
}
