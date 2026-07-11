# API 사용 가이드

## 먼저 읽어야 할 핵심 개념

이 프로젝트는 백엔드 호출을 **`serverApi` 하나로 통일**합니다.
`next/headers`로 쿠키를 읽어 요청하므로 서버 파일(RSC, Server Action, Route Handler)에서만 사용할 수 있습니다.
클라이언트 컴포넌트에서 import하면 빌드 에러가 납니다.

**클라이언트에서 데이터가 필요하면 `serverApi`를 감싼 Server Action을 만들고, 그 Action을 클라이언트에서 호출합니다.**
반복 조회(폴링)가 필요해도 마찬가지입니다 — TanStack Query의 `refetchInterval`로 폴링 주기를 관리하고, `queryFn` 안에서 Server Action을 호출합니다 (`src/featured/history/hooks/useIntvListQuery.ts` 참고). 클라이언트 전용 fetch 래퍼는 따로 두지 않습니다.

---

## 어떤 방법을 써야 할지 모르겠다면

```
백엔드 API를 호출해야 한다
│
├─ 서버에서 실행되는 코드인가?
│   ├─ RSC (페이지, 레이아웃)          → serverApi 직접 사용
│   ├─ Server Action (폼 제출, 뮤테이션) → serverApi 사용
│   └─ Route Handler                  → serverApi 사용
│
└─ 클라이언트에서 실행되는 코드인가?
    ├─ 폼 제출 / 데이터 변경            → Server Action 만들어서 serverApi 사용
    ├─ 데이터 조회 (1회성 이벤트 기반)   → Server Action 만들어서 serverApi 사용
    ├─ 폴링 (반복 조회)                → Server Action + TanStack Query(refetchInterval)
    └─ S3 등 외부 서비스               → raw fetch 사용 (serverApi 불가, base URL이 고정됨)
```

---

## 파일 구조

```
src/shared/lib/api/
  types.ts      — 타입 정의 (ApiResponse, NetworkError, RequestConfig 등)
  _utils.ts     — 내부 헬퍼 (직접 사용 X)
  serverApi.ts  — serverApi 구현 + accessToken 만료 시 재발급 폴백
  index.ts      — 공개 export
```

직접 import해서 쓰는 것은 `serverApi`와 `ApiResponse` 등 타입뿐입니다.

인증(accessToken/refreshToken) 갱신은 이 레이어의 책임이 아닙니다. 평상시엔 `src/proxy.ts`가 보호 라우트 진입 시점에 accessToken 부재를 감지해 미리 재발급하고, `serverApi`의 재발급 시도는 "요청 도중 만료"처럼 드문 경우의 폴백입니다. 이 레이어를 쓰는 입장에서는 신경 쓸 필요 없이 그냥 `serverApi.get/post/...`를 호출하면 됩니다.

---

## 1. RSC에서 데이터 패칭

페이지 진입 시 데이터를 서버에서 미리 가져올 때 사용합니다.
에러가 나면 가장 가까운 `error.tsx`로 이동합니다.

```tsx
// app/interviews/page.tsx
import { serverApi } from '@/shared/lib/api'

export default async function InterviewsPage() {
  const { data: interviews } = await serverApi.get<Interview[]>('/interviews')

  return (
    <ul>
      {interviews?.map((interview) => (
        <li key={interview.id}>{interview.title}</li>
      ))}
    </ul>
  )
}
```

여러 API를 동시에 호출할 때는 `Promise.all`로 묶어 속도를 높입니다.

```tsx
const [user, interviews] = await Promise.all([
  serverApi.get<User>('/me'),
  serverApi.get<Interview[]>('/interviews'),
])
```

> ⚠️ `(sidebar)` 그룹처럼 레이아웃이 이미 서버사이드로 데이터를 가져오는 라우트 하위에서, 페이지가 **또다시** 자기 렌더링 도중 `serverApi`/Server Action을 직접 호출하지 않도록 주의합니다. 같은 요청 안에서 인증 갱신이 중복 실행되면서 충돌할 수 있습니다. 클라이언트 컴포넌트 + Server Action 조합(2번 참고)을 쓰면 이 문제 자체가 생기지 않습니다.

---

## 2. Server Action — 폼 제출 / 데이터 변경 / 클라이언트 데이터 조회

폼 제출, 데이터 변경뿐 아니라 **클라이언트 컴포넌트가 필요로 하는 조회**도 이 방식으로 만듭니다.
Server Action은 서버에서 실행되므로 `serverApi`를 사용합니다.

**⚠️ Server Action에서 에러를 throw하면 안 되는 이유**

throw하면 에러가 error boundary로 가버려서 `useActionState`/`useQuery` 등으로 정상적으로 핸들링할 수 없습니다.
`redirect()` 같이 내부적으로 throw하는 함수는 예외적으로 반드시 re-throw해야 합니다. 공용 헬퍼 `withAction`이 이 처리를 대신해줍니다.

```ts
// features/screen/actions/screen.action.ts
'use server'

import { serverApi } from '@/shared/lib/api'
import { withAction } from '@/shared/lib/withAction'
import type { ApiResponse } from '@/shared/lib/api'
import type { Interview } from '../types'

export async function createInterviewAction(title: string): Promise<ApiResponse<Interview>> {
  return withAction(() => serverApi.post<Interview>('/interviews', { title }))
}
```

### 폼 제출 (useActionState)

```tsx
'use client'

import { useActionState } from 'react'
import { createInterviewAction } from '../actions/screen.action'

export function CreateForm() {
  const [state, action, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) =>
      createInterviewAction(formData.get('title') as string),
    null,
  )

  return (
    <form action={action}>
      <input name="title" required />
      {state && !state.success && <p className="text-destructive text-sm">{state.message}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? '생성 중...' : '생성'}
      </button>
    </form>
  )
}
```

### 조회 / 폴링 (TanStack Query)

일회성 조회든 반복 폴링이든, 클라이언트 훅이 Server Action을 호출하는 형태로 통일합니다.
같은 `queryKey`를 쓰는 컴포넌트끼리는 요청이 자동으로 하나로 합쳐집니다 (캐시 공유).

```tsx
// features/interview/hooks/useIntvStatusQuery.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { getIntvStatusAction } from '../actions/interview.action'

export function useIntvStatusQuery(id: string) {
  return useQuery({
    queryKey: ['intvStatus', id],
    queryFn: async () => {
      const res = await getIntvStatusAction(id)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    refetchInterval: 3000, // 폴링이 필요 없다면 생략
  })
}
```

---

## 3. raw fetch — 외부 서비스(S3 등)

`serverApi`는 `NEXT_PUBLIC_API_URL`을 base로 고정하므로 다른 서버에 요청할 수 없습니다.
S3 presigned URL 등 외부 서비스에 직접 요청할 때는 `fetch`를 그대로 사용합니다.

```ts
// presigned URL로 S3에 직접 업로드
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
})
```

---

## 에러 처리

`serverApi`는 실패 시 두 가지 중 하나를 throw합니다.

```ts
// 1) 네트워크 자체가 끊긴 경우
NetworkError { message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }

// 2) 백엔드가 success: false로 응답한 경우 — ApiResponse와 동일한 모양의 객체
{ success: false, code: 'USER-E001', message: '...', data: null, errors: [...] | null, httpStatus: 400 }
```

세부 분기는 `code`로, 일시적 에러(5xx) 여부 판단은 `httpStatus`로 합니다.

```ts
import type { ApiResponse } from '@/shared/lib/api'

try {
  return await withAction(() => serverApi.post<User>('/auth/login', { email, password }))
} catch (err) {
  const error = err as ApiResponse<null>
  if (error.code === 'USER-E001') {
    return { success: false as const, message: '존재하지 않는 계정입니다.' }
  }
  throw err
}
```

### 폼 필드 에러 처리

```ts
try {
  await serverApi.post('/auth/signup', { email, password })
} catch (err) {
  const error = err as ApiResponse<null>
  // error.errors = [{ field: 'email', reason: '이미 사용 중인 이메일입니다.' }, ...]
  error.errors?.forEach((e) => {
    // 필드별 에러 메시지 처리
  })
}
```

---

## RequestConfig 옵션

```ts
{
  params?: object     // URL 쿼리 파라미터 → /path?key=value 형태로 자동 변환
  headers?: object    // 추가 헤더
  cache?: RequestCache           // fetch 캐시 전략
  next?: NextFetchRequestConfig  // Next.js ISR revalidate 등
}
```

### 쿼리 파라미터

```ts
// GET /interviews?page=1&size=10
const list = await serverApi.get<InterviewList>('/interviews', {
  params: { page: 1, size: 10 },
})
```

### Next.js 캐싱 / ISR

```ts
// 항상 최신 데이터 (캐시 비활성화)
const data = await serverApi.get('/interviews', { cache: 'no-store' })

// 60초마다 자동 갱신
const data = await serverApi.get('/interviews', { next: { revalidate: 60 } })

// 태그로 수동 캐시 무효화
const data = await serverApi.get('/interviews', { next: { tags: ['interviews'] } })
```

---

## 한눈에 보기

```ts
// ✅ RSC — 서버에서 직접 데이터 패칭
const { data } = await serverApi.get<T>('/path')

// ✅ Server Action — withAction으로 감싸서 반환, throw 금지 (redirect는 예외)
export async function doThingAction(): Promise<ApiResponse<T>> {
  return withAction(() => serverApi.post<T>('/path', body))
}

// ✅ 클라이언트 조회/폴링 — Server Action + TanStack Query
const { data } = useQuery({
  queryKey: ['thing'],
  queryFn: async () => {
    const res = await doThingAction()
    if (!res.success) throw new Error(res.message)
    return res.data
  },
})

// ✅ 외부 서비스 — raw fetch
await fetch(externalUrl, { method: 'PUT', body: file })
```
