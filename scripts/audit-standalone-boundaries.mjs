import fs from 'node:fs/promises'

const candidates = [
  {
    name: 'Any Converter',
    files: [
      'src/components/dashboard/AnyToAnyConverter.tsx',
      'src/lib/converters.ts',
    ],
  },
]

const forbidden = [
  { label: 'Supabase client', pattern: /(?:@supabase\/supabase-js|@\/lib\/supabase|\.\/supabase)/ },
  { label: 'AppForge server API', pattern: /fetch\s*\(\s*['"`]\/api\// },
  { label: 'auth hook/context', pattern: /(?:useAuth|AuthProvider|auth\.getSession|auth\.getUser)/ },
  { label: 'Vercel server dependency', pattern: /(?:@vercel\/|process\.env\.)/ },
]

let failures = 0

for (const candidate of candidates) {
  for (const file of candidate.files) {
    const source = await fs.readFile(file, 'utf8')
    for (const rule of forbidden) {
      if (!rule.pattern.test(source)) continue
      failures += 1
      console.error(`[standalone-boundary] ${candidate.name}: ${file} includes forbidden ${rule.label} coupling.`)
    }
  }
}

if (failures) {
  console.error(`Standalone boundary audit failed with ${failures} violation${failures === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log(`Standalone boundary audit passed for ${candidates.length} candidate${candidates.length === 1 ? '' : 's'}.`)
