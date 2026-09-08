// Vercel serverless function
import { supabase, getMySQLConnection } from '../lib/db'

// @ts-ignore
export default async function handler(req: any, res: any) {
  const start = Date.now()

  // Check Supabase connection
  let supabaseStatus = 'not_configured'
  let supabaseLatency = 0
  if (supabase) {
    const supabaseStart = Date.now()
    try {
      const { error } = await supabase.from('apps').select('id').limit(1)
      supabaseLatency = Date.now() - supabaseStart
      supabaseStatus = error ? 'error' : 'connected'
    } catch {
      supabaseStatus = 'error'
    }
  }

  // Check MySQL connection
  let mysqlStatus = 'not_configured'
  let mysqlLatency = 0
  try {
    const mysqlStart = Date.now()
    const conn = await getMySQLConnection()
    await conn.query('SELECT 1')
    mysqlLatency = Date.now() - mysqlStart
    mysqlStatus = 'connected'
    await conn.end()
  } catch (e) {
    mysqlStatus = 'error'
  }

  const totalLatency = Date.now() - start

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    latency: `${totalLatency}ms`,
    services: {
      supabase: { status: supabaseStatus, latency: `${supabaseLatency}ms` },
      mysql: { status: mysqlStatus, latency: `${mysqlLatency}ms` }
    },
    version: process.env.APPFORGE_VERSION || '1.18.0'
  })
}
