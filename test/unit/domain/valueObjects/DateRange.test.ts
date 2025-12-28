import { describe, it, expect } from 'vitest'
import { DateRange } from '@domain/valueObjects/DateRange'

describe('DateRange Value Object', () => {
  describe('생성', () => {
    it('시작일과 종료일로 생성', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-31')
      const range = DateRange.create(start, end)

      expect(range.startDate.getTime()).toBe(start.getTime())
      expect(range.endDate.getTime()).toBe(end.getTime())
    })

    it('시작일이 종료일보다 크면 에러', () => {
      const start = new Date('2025-01-31')
      const end = new Date('2025-01-01')

      expect(() => DateRange.create(start, end)).toThrow('시작일은 종료일보다 이전이어야 합니다')
    })

    it('같은 날짜는 허용', () => {
      const date = new Date('2025-01-15')
      const range = DateRange.create(date, date)
      expect(range.days).toBe(1)
    })
  })

  describe('기간 계산', () => {
    it('일수 계산', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-10')
      const range = DateRange.create(start, end)

      expect(range.days).toBe(10) // 1일부터 10일까지 = 10일
    })

    it('주간 범위 생성', () => {
      const baseDate = new Date('2025-01-15') // 수요일
      const range = DateRange.thisWeek(baseDate)

      // 월요일부터 일요일까지
      expect(range.days).toBe(7)
    })

    it('월간 범위 생성', () => {
      const baseDate = new Date('2025-01-15')
      const range = DateRange.thisMonth(baseDate)

      expect(range.days).toBe(31) // 1월은 31일
    })
  })

  describe('포함 여부', () => {
    it('범위 내 날짜 포함', () => {
      const range = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )

      expect(range.contains(new Date('2025-01-15'))).toBe(true)
    })

    it('범위 외 날짜 불포함', () => {
      const range = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )

      expect(range.contains(new Date('2025-02-01'))).toBe(false)
    })

    it('경계 날짜 포함', () => {
      const range = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )

      expect(range.contains(new Date('2025-01-01'))).toBe(true)
      expect(range.contains(new Date('2025-01-31'))).toBe(true)
    })
  })

  describe('범위 겹침', () => {
    it('겹치는 범위', () => {
      const range1 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-20')
      )
      const range2 = DateRange.create(
        new Date('2025-01-15'),
        new Date('2025-02-10')
      )

      expect(range1.overlaps(range2)).toBe(true)
    })

    it('겹치지 않는 범위', () => {
      const range1 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-10')
      )
      const range2 = DateRange.create(
        new Date('2025-01-20'),
        new Date('2025-01-31')
      )

      expect(range1.overlaps(range2)).toBe(false)
    })

    it('인접한 범위 (경계가 맞닿음)', () => {
      const range1 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-10')
      )
      const range2 = DateRange.create(
        new Date('2025-01-10'),
        new Date('2025-01-20')
      )

      expect(range1.overlaps(range2)).toBe(true)
    })
  })

  describe('동등성 비교', () => {
    it('같은 시작일과 종료일이면 동등', () => {
      const range1 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )
      const range2 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )

      expect(range1.equals(range2)).toBe(true)
    })

    it('시작일이 다르면 동등하지 않음', () => {
      const range1 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )
      const range2 = DateRange.create(
        new Date('2025-01-02'),
        new Date('2025-01-31')
      )

      expect(range1.equals(range2)).toBe(false)
    })

    it('종료일이 다르면 동등하지 않음', () => {
      const range1 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )
      const range2 = DateRange.create(
        new Date('2025-01-01'),
        new Date('2025-01-30')
      )

      expect(range1.equals(range2)).toBe(false)
    })
  })

  describe('불변성', () => {
    it('startDate getter는 새 Date 객체 반환', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-31')
      const range = DateRange.create(start, end)

      const startRef1 = range.startDate
      const startRef2 = range.startDate

      // 서로 다른 객체
      expect(startRef1).not.toBe(startRef2)
      // 하지만 값은 같음
      expect(startRef1.getTime()).toBe(startRef2.getTime())
    })

    it('endDate getter는 새 Date 객체 반환', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-31')
      const range = DateRange.create(start, end)

      const endRef1 = range.endDate
      const endRef2 = range.endDate

      // 서로 다른 객체
      expect(endRef1).not.toBe(endRef2)
      // 하지만 값은 같음
      expect(endRef1.getTime()).toBe(endRef2.getTime())
    })
  })

  describe('thisWeek 경계 케이스', () => {
    it('월요일 기준', () => {
      const monday = new Date('2025-01-13') // 월요일
      const range = DateRange.thisWeek(monday)

      expect(range.startDate.getDay()).toBe(1) // 월요일
      expect(range.days).toBe(7)
    })

    it('일요일 기준', () => {
      const sunday = new Date('2025-01-19') // 일요일
      const range = DateRange.thisWeek(sunday)

      expect(range.startDate.getDay()).toBe(1) // 월요일
      expect(range.days).toBe(7)
    })
  })

  describe('thisMonth 경계 케이스', () => {
    it('2월 (28일)', () => {
      const feb = new Date('2025-02-15')
      const range = DateRange.thisMonth(feb)

      expect(range.days).toBe(28) // 2025년 2월은 28일
    })

    it('2월 윤년 (29일)', () => {
      const febLeap = new Date('2024-02-15')
      const range = DateRange.thisMonth(febLeap)

      expect(range.days).toBe(29) // 2024년 2월은 29일 (윤년)
    })
  })
})
