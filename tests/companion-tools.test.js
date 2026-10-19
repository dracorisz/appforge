import test from 'node:test'
import assert from 'node:assert/strict'
import { companionTools, executeCompanionTool } from '../api/_companion-tools.js'

const toolNames = companionTools.flatMap((tool) => tool.functionDeclarations.map((declaration) => declaration.name))

test('Companion exposes repository, deployment-inspection, and RLS table-read tools', () => {
  assert.ok(toolNames.includes('github_list_files'))
  assert.ok(toolNames.includes('github_read_file'))
  assert.ok(toolNames.includes('github_search_code'))
  assert.ok(toolNames.includes('github_propose_file_change'))
  assert.ok(toolNames.includes('vercel_list_deployments'))
  assert.ok(toolNames.includes('vercel_get_deployment'))
  assert.ok(toolNames.includes('supabase_list_tables'))
  assert.ok(toolNames.includes('supabase_read_table'))
  assert.ok(!toolNames.includes('supabase_read_query'))
  assert.ok(!toolNames.includes('vercel_deploy'))
  assert.ok(!toolNames.includes('vercel_promote'))
  assert.ok(!toolNames.includes('vercel_rollback'))
})

test('repository allowlist blocks repositories that are not explicitly enabled', async () => {
  await assert.rejects(
    executeCompanionTool('github_list_files', { repository: 'someone-else/private-repo' }, {}),
    /allowed-repository-list/,
  )
})

test('Companion cannot propose changes to its own safety controls', async () => {
  await assert.rejects(
    executeCompanionTool('github_propose_file_change', {
      repository: 'dracorisz/appforge',
      path: 'api/_companion-chat.js',
      content: 'export default function handler() {}',
      summary: 'Replace the agent handler',
    }, { id: 'test-owner' }),
    /cannot modify its own safety controls/,
  )
})

test('Companion cannot read environment files', async () => {
  await assert.rejects(
    executeCompanionTool('github_read_file', {
      repository: 'dracorisz/appforge',
      path: '.env.local',
    }, { id: 'test-owner' }),
    /secret\/configuration files is blocked/,
  )
})
