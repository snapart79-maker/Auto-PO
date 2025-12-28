import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Mock 모드 여부 - Supabase 환경변수가 없으면 Mock 모드로 실행
 */
export const isMockMode = !supabaseUrl || !supabaseAnonKey

/**
 * Supabase 클라이언트
 * Mock 모드에서는 더미 클라이언트 생성 (API 호출 시 에러 발생)
 */
export const supabase: SupabaseClient<Database> = isMockMode
  ? createClient<Database>('https://mock.supabase.co', 'mock-key')
  : createClient<Database>(supabaseUrl, supabaseAnonKey)

if (isMockMode) {
  console.warn('⚠️ Running in MOCK MODE - Supabase environment variables not configured')
  console.warn('   Create .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export type { Database }
