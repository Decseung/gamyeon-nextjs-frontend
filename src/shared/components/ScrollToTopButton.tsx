'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { ArrowUp } from 'lucide-react'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as Document | HTMLElement
      const scrollTop = target === document ? window.scrollY : (target as HTMLElement).scrollTop

      if (scrollTop > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const scrollableElements = document.querySelectorAll('*')
    scrollableElements.forEach((el) => {
      if (el.scrollTop > 0) {
        el.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  if (!isVisible) return null

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed right-8 bottom-8 z-100 h-12 w-12 cursor-pointer rounded-full border-[oklch(0.65_0.15_180)]/30 bg-white text-[oklch(0.65_0.15_180)] shadow-lg transition-all hover:border-[oklch(0.55_0.15_180)] hover:bg-[oklch(0.65_0.15_180)]/10 hover:text-[oklch(0.55_0.15_180)] hover:shadow-xl"
      onClick={scrollToTop}
      aria-label="맨 위로 가기"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
