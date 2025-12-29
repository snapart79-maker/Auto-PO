/**
 * ERPGroupBox - ERP/MES 스타일 그룹박스 컴포넌트
 * 파란 테두리, 레이블 타이틀
 */

import { cn } from '../lib/utils'

interface ERPGroupBoxProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ERPGroupBox({ title, children, className }: ERPGroupBoxProps) {
  return (
    <fieldset
      className={cn(
        'border border-[#7a9cc6] rounded bg-[#f5f8fc] p-3 pt-2',
        className
      )}
    >
      <legend className="text-xs font-medium text-[#4a6fa5] px-1">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

/**
 * ERPFormField - 조회조건 레이블 + 입력 필드
 */
interface ERPFormFieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function ERPFormField({ label, children, className }: ERPFormFieldProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label className="text-xs text-gray-700 whitespace-nowrap min-w-[60px]">
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * ERPInput - ERP 스타일 입력 필드
 */
interface ERPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md' | 'lg'
}

export function ERPInput({ inputSize = 'md', className, ...props }: ERPInputProps) {
  const sizeClasses = {
    sm: 'w-20',
    md: 'w-32',
    lg: 'w-48',
  }
  return (
    <input
      className={cn(
        'border border-[#999] rounded px-2 py-1 text-xs',
        'focus:outline-none focus:border-[#4a6fa5] focus:ring-1 focus:ring-[#4a6fa5]',
        sizeClasses[inputSize],
        className
      )}
      {...props}
    />
  )
}

/**
 * ERPSelect - ERP 스타일 셀렉트 박스
 */
interface ERPSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  inputSize?: 'sm' | 'md' | 'lg'
}

export function ERPSelect({ inputSize = 'md', className, children, ...props }: ERPSelectProps) {
  const sizeClasses = {
    sm: 'w-20',
    md: 'w-32',
    lg: 'w-48',
  }
  return (
    <select
      className={cn(
        'border border-[#999] rounded px-2 py-1 text-xs bg-white',
        'focus:outline-none focus:border-[#4a6fa5] focus:ring-1 focus:ring-[#4a6fa5]',
        sizeClasses[inputSize],
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

/**
 * ERPDateInput - ERP 스타일 날짜 입력
 */
interface ERPDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export function ERPDateInput({ className, ...props }: ERPDateInputProps) {
  return (
    <input
      type="date"
      className={cn(
        'border border-[#999] rounded px-2 py-1 text-xs w-28',
        'focus:outline-none focus:border-[#4a6fa5] focus:ring-1 focus:ring-[#4a6fa5]',
        className
      )}
      {...props}
    />
  )
}

/**
 * ERPButton - ERP 스타일 버튼
 */
interface ERPButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
}

export function ERPButton({
  variant = 'secondary',
  size = 'sm',
  className,
  children,
  ...props
}: ERPButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white border-[#3d5a80] hover:from-[#6a8fc5] hover:to-[#5a7fb5]',
    secondary: 'bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] text-gray-700 border-[#999] hover:from-[#fff] hover:to-[#f0f0f0]',
    danger: 'bg-gradient-to-b from-[#dc6c6c] to-[#c55a5a] text-white border-[#a04040] hover:from-[#ec7c7c] hover:to-[#d56a6a]',
  }
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  }
  return (
    <button
      className={cn(
        'border rounded font-medium',
        'focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * ERPIconButton - 아이콘 버튼 (조회, 설정 등)
 */
interface ERPIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
}

export function ERPIconButton({
  icon,
  label,
  variant = 'secondary',
  className,
  ...props
}: ERPIconButtonProps) {
  const variantClasses = {
    primary: 'text-[#4a6fa5] hover:bg-[#e8f0ff]',
    secondary: 'text-gray-600 hover:bg-[#e8e8e8]',
    danger: 'text-red-600 hover:bg-red-50',
  }
  return (
    <button
      className={cn(
        'flex flex-col items-center px-3 py-1 rounded',
        'focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  )
}
