/**
 * SplitRatioEditor Component
 * 이원화 비율 편집기
 */

import { useState, useCallback } from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export interface SplitRatioEditorProps {
  /** 현재 국내 비율 (0-100) */
  domesticRatio: number
  /** 비율 변경 콜백 */
  onRatioChange: (ratio: number) => void
  /** 저장 콜백 */
  onSave?: () => void
  /** 취소 콜백 */
  onCancel?: () => void
  /** 저장 중 여부 */
  isSaving?: boolean
  /** 샘플 수량 (분할 미리보기용) */
  sampleQuantity?: number
  /** 비활성화 */
  disabled?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

export function SplitRatioEditor({
  domesticRatio,
  onRatioChange,
  onSave,
  onCancel,
  isSaving = false,
  sampleQuantity = 100,
  disabled = false,
  className,
}: SplitRatioEditorProps) {
  const [localRatio, setLocalRatio] = useState(domesticRatio)

  const vietnamRatio = 100 - localRatio

  // 분할 수량 계산
  const domesticQuantity = Math.round(sampleQuantity * (localRatio / 100))
  const vietnamQuantity = sampleQuantity - domesticQuantity

  // 비율 변경 핸들러
  const handleRatioChange = useCallback(
    (value: number) => {
      const clampedValue = Math.max(0, Math.min(100, value))
      setLocalRatio(clampedValue)
      onRatioChange(clampedValue)
    },
    [onRatioChange]
  )

  // 슬라이더 변경 핸들러
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleRatioChange(parseInt(e.target.value, 10))
    },
    [handleRatioChange]
  )

  // 입력 변경 핸들러
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (!isNaN(value)) {
        handleRatioChange(value)
      }
    },
    [handleRatioChange]
  )

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg">이원화 비율 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 슬라이더 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>국내 / 베트남 비율</Label>
            <span className="text-sm font-medium">
              {localRatio}% / {vietnamRatio}%
            </span>
          </div>

          <div className="relative pt-1">
            <input
              type="range"
              min="0"
              max="100"
              value={localRatio}
              onChange={handleSliderChange}
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>베트남 100%</span>
              <span>균등 50/50</span>
              <span>국내 100%</span>
            </div>
          </div>
        </div>

        {/* 비율 입력 필드 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="domestic-ratio">국내 비율 (%)</Label>
            <Input
              id="domestic-ratio"
              type="number"
              min={0}
              max={100}
              value={localRatio}
              onChange={handleInputChange}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vietnam-ratio">베트남 비율 (%)</Label>
            <Input
              id="vietnam-ratio"
              type="number"
              min={0}
              max={100}
              value={vietnamRatio}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        {/* 분할 미리보기 */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Label className="text-sm font-medium">분할 미리보기</Label>
          <p className="text-xs text-muted-foreground">
            예시 수량 {sampleQuantity.toLocaleString()}개 기준
          </p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="text-center p-3 bg-background rounded-md">
              <div className="text-xs text-muted-foreground">국내</div>
              <div className="text-xl font-bold">{domesticQuantity.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-background rounded-md">
              <div className="text-xs text-muted-foreground">베트남</div>
              <div className="text-xl font-bold">{vietnamQuantity.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        {(onSave || onCancel) && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                취소
              </Button>
            )}
            {onSave && (
              <Button onClick={onSave} disabled={isSaving || disabled}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
