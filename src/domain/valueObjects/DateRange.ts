/**
 * DateRange Value Object
 * 날짜 범위를 나타내는 불변 객체
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export class DateRange {
  private constructor(
    private readonly _startDate: Date,
    private readonly _endDate: Date
  ) {}

  get startDate(): Date {
    return new Date(this._startDate.getTime())
  }

  get endDate(): Date {
    return new Date(this._endDate.getTime())
  }

  /**
   * 기간의 일수 (시작일과 종료일 모두 포함)
   */
  get days(): number {
    // 날짜만 비교 (시간 무시)
    const start = new Date(this._startDate.getFullYear(), this._startDate.getMonth(), this._startDate.getDate())
    const end = new Date(this._endDate.getFullYear(), this._endDate.getMonth(), this._endDate.getDate())
    const diffTime = end.getTime() - start.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  /**
   * DateRange 생성
   * @throws 시작일이 종료일보다 크면 에러
   */
  static create(startDate: Date, endDate: Date): DateRange {
    if (startDate.getTime() > endDate.getTime()) {
      throw new Error('시작일은 종료일보다 이전이어야 합니다')
    }
    return new DateRange(new Date(startDate.getTime()), new Date(endDate.getTime()))
  }

  /**
   * 해당 주의 월요일~일요일 범위
   */
  static thisWeek(baseDate: Date): DateRange {
    const date = new Date(baseDate.getTime())
    const day = date.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day

    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return new DateRange(monday, sunday)
  }

  /**
   * 해당 월의 1일~말일 범위
   */
  static thisMonth(baseDate: Date): DateRange {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()

    const firstDay = new Date(year, month, 1, 0, 0, 0, 0)
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999)

    return new DateRange(firstDay, lastDay)
  }

  /**
   * 특정 날짜가 범위에 포함되는지 확인
   */
  contains(date: Date): boolean {
    const time = date.getTime()
    return time >= this._startDate.getTime() && time <= this._endDate.getTime()
  }

  /**
   * 다른 범위와 겹치는지 확인
   */
  overlaps(other: DateRange): boolean {
    return (
      this._startDate.getTime() <= other._endDate.getTime() &&
      this._endDate.getTime() >= other._startDate.getTime()
    )
  }

  equals(other: DateRange): boolean {
    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    )
  }
}
