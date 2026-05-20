import { FaceLandmarker } from '@mediapipe/tasks-vision'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ALIGN_DURATION_MS } from '@/featured/interview/constants'
import { useGazeTracker } from '@/featured/interview/hooks/useGazeTracker'
import { type PermStatus } from '@/featured/interview/types'
import { validateFacePosition } from '@/featured/interview/utils/setupUtils'
import { trackFunnel } from '@/shared/lib/utils/analytics'

interface UseCameraModalHandlerReturn {
  landmarker: FaceLandmarker | null
  cameraStatus: PermStatus
  setCameraStatus: React.Dispatch<React.SetStateAction<PermStatus>>
  cameraVideoRef: React.RefCallback<HTMLVideoElement>
  basePose: { pitch: number; yaw: number } | null
  alignProgress: number
  faceDetected: boolean
  requestCamera: () => Promise<void>
  confirmCamera: () => void
  cleanupCamera: () => void
  cameraStream: MediaStream | null
}

export function useCameraHandler(): UseCameraModalHandlerReturn {
  const { landmarker } = useGazeTracker()

  const [cameraStatus, setCameraStatus] = useState<PermStatus>('idle')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [basePose, setBasePose] = useState<{ pitch: number; yaw: number } | null>(null)
  const [alignProgress, setAlignProgress] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)

  const cameraVideoElementRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const poseDetectRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)

  const hasLiveVideoTrack = useCallback((stream: MediaStream | null) => {
    if (!stream) return false
    return stream.getVideoTracks().some((track) => track.readyState === 'live')
  }, [])

  const resetCameraState = useCallback(() => {
    cameraStreamRef.current = null
    setCameraStream(null)
    setBasePose(null)
    setAlignProgress(0)
    setFaceDetected(false)
  }, [])

  const cameraVideoRef = useCallback<React.RefCallback<HTMLVideoElement>>(
    (node) => {
      cameraVideoElementRef.current = node

      if (!node) return

      if (cameraStatus !== 'granted') {
        node.srcObject = null
        return
      }

      const stream = cameraStreamRef.current
      if (!hasLiveVideoTrack(stream)) {
        node.srcObject = null
        resetCameraState()
        setCameraStatus('idle')
        return
      }

      node.srcObject = stream
    },
    [cameraStatus, hasLiveVideoTrack, resetCameraState],
  )

  useEffect(() => {
    const video = cameraVideoElementRef.current
    if (!video) return

    if (cameraStatus !== 'granted') {
      video.srcObject = null
      return
    }

    if (!hasLiveVideoTrack(cameraStream)) {
      video.srcObject = null
      return
    }

    cameraStreamRef.current = cameraStream
    video.srcObject = cameraStream
  }, [cameraStatus, cameraStream, hasLiveVideoTrack, resetCameraState])

  useEffect(() => {
    if (cameraStatus !== 'granted' || !cameraStream) return

    const handleTrackEnded = () => {
      resetCameraState()
      setCameraStatus('idle')
    }

    const videoTracks = cameraStream.getVideoTracks()
    videoTracks.forEach((track) => track.addEventListener('ended', handleTrackEnded))

    return () => {
      videoTracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded))
    }
  }, [cameraStatus, cameraStream, resetCameraState])

  useEffect(() => {
    if (cameraStatus !== 'granted' || !landmarker || basePose) return

    const faceLandmarker = landmarker
    const video = cameraVideoElementRef.current
    if (!video) return

    let alignStart: number | null = null

    const detect = () => {
      if (video.readyState !== 4) {
        poseDetectRef.current = requestAnimationFrame(detect)
        return
      }

      try {
        const now = performance.now()
        const result = faceLandmarker.detectForVideo(video, now)

        if (!result.faceLandmarks?.length) {
          alignStart = null
          setAlignProgress(0)
          setFaceDetected(false)
          poseDetectRef.current = requestAnimationFrame(detect)
          return
        }

        setFaceDetected(true)

        const matrixes = result.facialTransformationMatrixes
        if (!matrixes?.length) {
          poseDetectRef.current = requestAnimationFrame(detect)
          return
        }

        const { inPosition, pitch, yaw } = validateFacePosition(result, matrixes)
        if (inPosition) {
          if (alignStart === null) alignStart = now
          const elapsed = now - alignStart
          setAlignProgress(Math.min(100, (elapsed / ALIGN_DURATION_MS) * 100))

          if (elapsed >= ALIGN_DURATION_MS) {
            setBasePose({ pitch: Math.round(pitch), yaw: Math.round(yaw) })
            return
          }
        } else {
          alignStart = null
          setAlignProgress(0)
        }
      } catch {}

      poseDetectRef.current = requestAnimationFrame(detect)
    }

    poseDetectRef.current = requestAnimationFrame(detect)
    return () => {
      if (poseDetectRef.current) cancelAnimationFrame(poseDetectRef.current)
    }
  }, [basePose, cameraStatus, landmarker])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (poseDetectRef.current) {
        cancelAnimationFrame(poseDetectRef.current)
        poseDetectRef.current = null
      }
      const stream = cameraStreamRef.current
      if (stream) {
        stream.getTracks().forEach((track) => {
          if (track.readyState === 'live') track.stop()
        })
        cameraStreamRef.current = null
      }
      if (cameraVideoElementRef.current) {
        cameraVideoElementRef.current.srcObject = null
      }
    }
  }, [])

  const requestCamera = async () => {
    setBasePose(null)
    setAlignProgress(0)
    setFaceDetected(false)
    setCameraStatus('requesting')

    try {
      await navigator.mediaDevices.enumerateDevices()
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      cameraStreamRef.current = stream
      setCameraStream(stream)
      setCameraStatus('granted')
      trackFunnel('cam_permission_granted')
    } catch {
      if (!isMountedRef.current) return
      resetCameraState()
      setCameraStatus('denied')
      trackFunnel('cam_permission_denied')
    }
  }

  const confirmCamera = () => {
    if (poseDetectRef.current) {
      cancelAnimationFrame(poseDetectRef.current)
      poseDetectRef.current = null
    }
  }

  const cleanupCamera = useCallback(() => {
    console.log(
      '[cleanupCamera] called, stream:',
      cameraStreamRef.current,
      'video:',
      cameraVideoElementRef.current,
    )
    if (poseDetectRef.current) {
      cancelAnimationFrame(poseDetectRef.current)
      poseDetectRef.current = null
    }

    const stream = cameraStreamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log('[cleanupCamera] track:', track.label, 'readyState:', track.readyState)
        if (track.readyState === 'live') {
          track.stop()
          console.log('[cleanupCamera] track.stop() called')
        }
      })
    }

    if (cameraVideoElementRef.current) {
      cameraVideoElementRef.current.srcObject = null
    }

    resetCameraState()
    setCameraStatus('idle')
  }, [resetCameraState])

  return {
    landmarker,
    cameraStatus,
    setCameraStatus,
    cameraVideoRef,
    basePose,
    alignProgress,
    faceDetected,
    requestCamera,
    confirmCamera,
    cleanupCamera,
    cameraStream,
  }
}
