import { useState, useRef, useEffect, useCallback } from 'react'
import { type PermStatus } from '@/featured/interview/types'
import { trackFunnel } from '@/shared/lib/utils/analytics'

export interface UseMicPermissionReturn {
  micStatus: PermStatus
  setMicStatus: React.Dispatch<React.SetStateAction<PermStatus>>
  audioLevel: number
  micStreamRef: React.RefObject<MediaStream | null>
  requestMic: () => Promise<void>
  cleanupMic: () => void
}

export function useMicPermission(onStartPollingRequest: () => void): UseMicPermissionReturn {
  const [micStatus, setMicStatus] = useState<PermStatus>('idle')
  const [audioLevel, setAudioLevel] = useState(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const levelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 마이크 허용 후 오디오 레벨 폴링 (80ms 간격)
  useEffect(() => {
    if (micStatus !== 'granted') return
    levelIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setAudioLevel(Math.min(1, avg / 60))
    }, 80)
    return () => {
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current)
    }
  }, [micStatus])

  // 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current)
      audioCtxRef.current?.close()
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const requestMic = async () => {
    setMicStatus('requesting')
    trackFunnel('request_mic_permission')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      setMicStatus('granted')
      trackFunnel('mic_permission_granted')
      onStartPollingRequest()
    } catch {
      setMicStatus('denied')
      trackFunnel('mic_permission_denied')
    }
  }

  const cleanupMic = useCallback(() => {
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current)
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    setAudioLevel(0)
  }, [])

  return {
    micStatus,
    setMicStatus,
    audioLevel,
    micStreamRef,
    requestMic,
    cleanupMic,
  }
}
