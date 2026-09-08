import { createClient } from '@supabase/supabase-js'
import mysql from 'mysql2/promise'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function getMySQLConnection() {
  const host = process.env.MYSQL_HOST
  const port = parseInt(process.env.MYSQL_PORT || '3306')
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE

  if (!host || !user || !password || !database) {
    throw new Error('MySQL environment variables not configured')
  }

  return mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  })
}
