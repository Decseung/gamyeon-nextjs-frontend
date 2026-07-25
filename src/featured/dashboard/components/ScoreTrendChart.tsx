'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Inbox } from 'lucide-react'
import { ChartDataItem, CustomTooltipProps, ScoreTrendChartProps } from '../types'

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const { position, score } = payload[0].payload
  return (
    <div className="max-w-26.25 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="truncate text-[11px] font-semibold text-slate-700">{position}</p>
      <p className="mt-1 text-[13px] font-bold text-sky-500">{score}점</p>
    </div>
  )
}

export function ScoreTrendChart({ weekStart, weekEnd, records }: ScoreTrendChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // setTimeout 0을 사용하여 리액트의 동기적 렌더링 흐름을 방해하지 않고 다음 태스크 큐에서 상태를 변경
    const timer = setTimeout(() => {
      setIsClient(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!records) return []

    return records
      .filter((r) => r.intvStatus === 'FINISHED' && r.report?.totalScore !== null)
      .map((r) => ({
        name: '', // 아래 map에서 회차로 채워짐
        score: r.report?.totalScore || 0,
        position: r.title,
        dateObj: new Date(r.updatedAt),
      }))
      .filter((s) => s.dateObj >= weekStart && s.dateObj <= weekEnd)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(-10) // 최근 10개만 표시
      .map((s, i) => ({
        name: `${i + 1}회차`,
        score: s.score,
        position: s.position,
      }))
  }, [records, weekStart, weekEnd])

  // 서버 사이드 렌더링 중이거나 클라이언트 준비 전에는 빈 공간만 반환
  if (!isClient) {
    return <div className="min-h-0 flex-1 animate-pulse rounded-xl bg-slate-50/50" />
  }

  return (
    <div className="relative min-h-0 flex-1">
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center gap-2">
          <div className="bg-muted/30 flex h-12 w-12 items-center justify-center rounded-full">
            <Inbox className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">진행된 면접 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'currentColor', fillOpacity: 0.45 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: 'currentColor', fillOpacity: 0.45 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#0ea5e9', strokeOpacity: 0.25, strokeWidth: 1 }}
              />
              <Area
                type="linear"
                dataKey="score"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={{ fill: 'white', stroke: '#0ea5e9', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#0ea5e9', stroke: 'white', strokeWidth: 2, r: 5 }}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
