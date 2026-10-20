export interface AppDefinition {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  icon: string
  route: string
  version: string
  status: 'stable' | 'beta' | 'deprecated'
  keywords: string[]
  features: string[]
}

export const APP_REGISTRY: Record<string, AppDefinition> = {
  companion: {
    id: 'companion',
    name: 'Lamat',
    tagline: 'Persistent, goal-oriented autonomous AI operator',
    description:
      'Persistent autonomous operator backed by Supabase PostgreSQL and Google Vertex AI that plans, executes, verifies, and continues work toward owner goals.',
    category: 'ai',
    icon: 'Bot',
    route: '/',
    version: '2.0.0',
    status: 'stable',
    keywords: ['lamat', 'autonomous', 'operator', 'vertex', 'supabase', 'goals', 'tasks'],
    features: [
      'Persistent goals, tasks, plans, checkpoints, and verification evidence in Supabase',
      'Multi-role Vertex AI orchestration (Strategist, Planner, Researcher, Executor, Evaluator, Memory Processor, Supervisor)',
      'Execution-layer authority boundaries, parameter-bound approvals, and budget enforcement',
      'Conversational workspace with text, image upload, and voice input/output',
    ],
  },
}

const APP_ID_ALIASES: Record<string, string> = {
  maya: 'companion',
  lamet: 'companion',
  lamat: 'companion',
}

export function resolveAppId(id: string): string {
  return APP_ID_ALIASES[id] || id
}

export function getApp(id: string): AppDefinition | undefined {
  return APP_REGISTRY[resolveAppId(id)]
}

export function getAllApps(): AppDefinition[] {
  return Object.values(APP_REGISTRY)
}

export function getPublicApps(): AppDefinition[] {
  return []
}
