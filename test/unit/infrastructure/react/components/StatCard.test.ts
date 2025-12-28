/**
 * StatCard 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  getStatCardClasses,
  type StatCardVariant,
} from '@infrastructure/react/components/StatCard'

describe('StatCard 유틸리티', () => {
  describe('getStatCardClasses', () => {
    it('default variant 스타일', () => {
      const classes = getStatCardClasses('default')
      expect(classes.container).toContain('bg-card')
      expect(classes.icon).toContain('text-muted-foreground')
    })

    it('warning variant 스타일', () => {
      const classes = getStatCardClasses('warning')
      expect(classes.container).toContain('border-orange')
      expect(classes.icon).toContain('text-orange')
      expect(classes.value).toContain('text-orange')
    })

    it('success variant 스타일', () => {
      const classes = getStatCardClasses('success')
      expect(classes.container).toContain('border-green')
      expect(classes.icon).toContain('text-green')
    })

    it('info variant 스타일', () => {
      const classes = getStatCardClasses('info')
      expect(classes.container).toContain('border-blue')
      expect(classes.icon).toContain('text-blue')
    })

    it('danger variant 스타일', () => {
      const classes = getStatCardClasses('danger')
      expect(classes.container).toContain('border-red')
      expect(classes.icon).toContain('text-red')
    })
  })

  describe('StatCardVariant 타입', () => {
    it('variant 타입 검증', () => {
      const variants: StatCardVariant[] = ['default', 'warning', 'success', 'info', 'danger']
      expect(variants).toHaveLength(5)
    })
  })
})
