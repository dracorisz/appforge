import { Navigate } from 'react-router-dom'

export interface PariflowDoc {
  id: string
  title: string
  url: string
  section: string
  scrapedAt: string
}

export function PF_PariflowSmpl() {
  return <Navigate to="/apps" replace />
}
