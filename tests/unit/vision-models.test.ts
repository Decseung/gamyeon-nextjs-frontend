import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
  resolver: vi.fn(),
  landmarker: vi.fn(),
  detector: vi.fn(),
}))

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: sdk.resolver },
  FaceLandmarker: { createFromOptions: sdk.landmarker },
  FaceDetector: { createFromOptions: sdk.detector },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

let loader: typeof import('@/featured/interview/lib/visionModels')
let landmarker: { close: ReturnType<typeof vi.fn> }
let detector: { close: ReturnType<typeof vi.fn> }

beforeEach(async () => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  landmarker = { close: vi.fn() }
  detector = { close: vi.fn() }
  sdk.resolver.mockResolvedValue({})
  sdk.landmarker.mockResolvedValue(landmarker)
  sdk.detector.mockResolvedValue(detector)
  loader = await import('@/featured/interview/lib/visionModels')
})

afterEach(() => vi.restoreAllMocks())

describe('shared vision model lifecycle', () => {
  it('shares a pending initialization and caches the same successful models', async () => {
    const pending = deferred<typeof landmarker>()
    sdk.landmarker.mockReturnValueOnce(pending.promise)

    const first = loader.getVisionModels()
    const second = loader.getVisionModels()
    expect(first).toBe(second)
    expect(loader.getCachedVisionModels()).toBeNull()

    pending.resolve(landmarker)
    const [one, two] = await Promise.all([first, second])
    expect(one).toBe(two)
    expect(loader.getCachedVisionModels()).toBe(one)
    expect(await loader.getVisionModels()).toBe(one)
    expect(sdk.resolver).toHaveBeenCalledTimes(1)
    expect(sdk.landmarker).toHaveBeenCalledTimes(1)
    expect(sdk.detector).toHaveBeenCalledTimes(1)
    expect(landmarker.close).not.toHaveBeenCalled()
    expect(detector.close).not.toHaveBeenCalled()
  })

  it.each(['landmarker', 'detector'] as const)(
    'releases a late successful model when %s fails, then allows a shared retry',
    async (failedKind) => {
      const successKind = failedKind === 'landmarker' ? 'detector' : 'landmarker'
      const successfulModel = successKind === 'landmarker' ? landmarker : detector
      const failed = deferred<typeof landmarker>()
      const lateSuccess = deferred<typeof landmarker>()
      sdk[failedKind].mockReturnValueOnce(failed.promise)
      sdk[successKind].mockReturnValueOnce(lateSuccess.promise)

      const first = loader.getVisionModels()
      const second = loader.getVisionModels()
      const firstFailure = expect(first).rejects.toThrow('initialization failed')
      const secondFailure = expect(second).rejects.toThrow('initialization failed')
      await vi.waitFor(() => expect(sdk[failedKind]).toHaveBeenCalledTimes(1))
      failed.reject(new Error('initialization failed'))
      // Do not start a retry while a sibling from the failed attempt still runs.
      expect(loader.getVisionModels()).toBe(first)
      lateSuccess.resolve(successfulModel)
      await Promise.all([firstFailure, secondFailure])

      expect(successfulModel.close).toHaveBeenCalledTimes(1)
      expect(loader.getCachedVisionModels()).toBeNull()
      expect(console.error).toHaveBeenCalledTimes(1)

      const nextLandmarker = { close: vi.fn() }
      const nextDetector = { close: vi.fn() }
      sdk.landmarker.mockResolvedValue(nextLandmarker)
      sdk.detector.mockResolvedValue(nextDetector)
      const retry = loader.getVisionModels()
      expect(loader.getVisionModels()).toBe(retry)
      const models = await retry
      expect(models).toEqual({ landmarker: nextLandmarker, detector: nextDetector })
      expect(await loader.getVisionModels()).toBe(models)
      expect(sdk.landmarker).toHaveBeenCalledTimes(2)
      expect(sdk.detector).toHaveBeenCalledTimes(2)
      expect(nextLandmarker.close).not.toHaveBeenCalled()
      expect(nextDetector.close).not.toHaveBeenCalled()
    },
  )

  it('retries if both models fail without publishing a partial cache', async () => {
    sdk.landmarker.mockRejectedValueOnce(new Error('landmarker failed'))
    sdk.detector.mockRejectedValueOnce(new Error('detector failed'))
    await expect(loader.getVisionModels()).rejects.toThrow('landmarker failed')
    expect(loader.getCachedVisionModels()).toBeNull()
    expect(console.error).toHaveBeenCalledTimes(1)
    await expect(loader.getVisionModels()).resolves.toEqual({ landmarker, detector })
    expect(sdk.resolver).toHaveBeenCalledTimes(2)
  })

  it('retries resolver failures before attempting model creation', async () => {
    sdk.resolver.mockRejectedValueOnce(new Error('WASM unavailable'))
    await expect(loader.getVisionModels()).rejects.toThrow('WASM unavailable')
    expect(sdk.landmarker).not.toHaveBeenCalled()
    expect(sdk.detector).not.toHaveBeenCalled()
    await expect(loader.getVisionModels()).resolves.toEqual({ landmarker, detector })
    expect(sdk.resolver).toHaveBeenCalledTimes(2)
  })
})
