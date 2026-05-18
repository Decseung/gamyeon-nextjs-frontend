import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/shared/ui/tooltip'
import ReactQueryProvider from '@/shared/lib/ReactQueryProvider'
import { Toaster } from 'sonner'
import './globals.css'
import { GoogleAnalytics } from '@next/third-parties/google'
import ClarityProvider from '@/shared/lib/ClarityProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | 가면',
    default: '가면 | 가상 면접 AI',
  },
  description:
    'AI 기반 실전 면접 연습으로 합격을 준비하세요. 실시간 피드백과 맞춤형 분석으로 면접 실력을 한 단계 끌어올립니다.',

  //  SEO 검색 키워드
  keywords: ['AI 면접', '가상 면접', '면접 연습', '취업 준비', '모의 면접', '가면', 'Gamyeon'],

  //  Open Graph
  openGraph: {
    title: '가면 | 가상 면접 AI',
    description: 'AI 기반 실전 면접 연습으로 합격을 준비하세요.',
    url: 'https://gamyeon.co.kr',
    siteName: '가면',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '가면 AI 서비스 미리보기 이미지',
      },
    ],
  },

  // 파비콘
  icons: {
    icon: '/images/Gamyeon_Logo.svg',
    shortcut: '/images/Gamyeon_Logo.svg',
    apple: '/images/Gamyeon_Logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <ClarityProvider clarityId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || ''} />
        <ReactQueryProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </ReactQueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
