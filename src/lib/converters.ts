export interface Converter {
  id: string
  name: string
  inputFormat: string
  outputFormat: string
  convert: (input: string) => string | Promise<string>
  validate?: (input: string) => boolean
  description?: string
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  const source = input.replace(/^\uFEFF/, '')

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    const next = source[i + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (char === ',' && !quoted) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(field)
      if (row.some(cell => cell.length > 0)) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (quoted) throw new Error('Invalid CSV: an opening quote is missing its closing quote.')

  row.push(field)
  if (row.some(cell => cell.length > 0)) rows.push(row)

  return rows
}

function csvCell(value: unknown): string {
  if (value == null) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function jsonArrayToCsv(input: string): string {
  const data = JSON.parse(input)
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('JSON → CSV expects a non-empty array of objects.')
  }
  if (data.some(item => item === null || Array.isArray(item) || typeof item !== 'object')) {
    throw new Error('JSON → CSV expects every array item to be an object.')
  }

  const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))))
  if (headers.length === 0) throw new Error('The JSON objects do not contain any fields to export.')

  return [
    headers.map(csvCell).join(','),
    ...data.map(row => headers.map(header => csvCell(row[header])).join(',')),
  ].join('\n')
}

function csvToJson(input: string): string {
  const rows = parseCsv(input)
  if (rows.length < 2) throw new Error('CSV → JSON needs a header row and at least one data row.')

  const headers = rows[0].map(header => header.trim())
  if (headers.some(header => !header)) throw new Error('CSV header names cannot be empty.')

  const result = rows.slice(1).map((values, rowIndex) => {
    if (values.length > headers.length) {
      throw new Error(`CSV row ${rowIndex + 2} has more values than the header row.`)
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })

  return JSON.stringify(result, null, 2)
}

const converters: Converter[] = [
  {
    id: 'json-to-csv',
    name: 'JSON → CSV',
    inputFormat: 'json',
    outputFormat: 'csv',
    convert: jsonArrayToCsv,
    validate: (input) => {
      try {
        const value = JSON.parse(input)
        return Array.isArray(value) && value.length > 0 && value.every(item => item && typeof item === 'object' && !Array.isArray(item))
      } catch {
        return false
      }
    },
    description: 'Convert an array of JSON objects to standards-friendly CSV, including quoted commas and newlines.',
  },
  {
    id: 'csv-to-json',
    name: 'CSV → JSON',
    inputFormat: 'csv',
    outputFormat: 'json',
    convert: csvToJson,
    validate: (input) => {
      try { return parseCsv(input).length >= 2 } catch { return false }
    },
    description: 'Parse CSV with quoted fields, escaped quotes, commas, and multiline values.',
  },
  {
    id: 'json-to-yaml',
    name: 'JSON → YAML',
    inputFormat: 'json',
    outputFormat: 'yaml',
    convert: (input) => jsonToYaml(JSON.parse(input)),
    validate: (input) => {
      try { JSON.parse(input); return true } catch { return false }
    },
  },
  {
    id: 'yaml-to-json',
    name: 'YAML → JSON',
    inputFormat: 'yaml',
    outputFormat: 'json',
    convert: (input) => JSON.stringify(yamlToJson(input), null, 2),
  },
  {
    id: 'xml-to-json',
    name: 'XML → JSON',
    inputFormat: 'xml',
    outputFormat: 'json',
    convert: (input) => JSON.stringify(xmlToJson(input), null, 2),
  },
  {
    id: 'markdown-to-html',
    name: 'Markdown → HTML',
    inputFormat: 'markdown',
    outputFormat: 'html',
    convert: markdownToHtml,
  },
  {
    id: 'html-to-markdown',
    name: 'HTML → Markdown',
    inputFormat: 'html',
    outputFormat: 'markdown',
    convert: htmlToMarkdown,
  },
  {
    id: 'base64-encode',
    name: 'Text → Base64',
    inputFormat: 'text',
    outputFormat: 'base64',
    convert: (input) => bytesToBase64(new TextEncoder().encode(input)),
  },
  {
    id: 'base64-decode',
    name: 'Base64 → Text',
    inputFormat: 'base64',
    outputFormat: 'text',
    convert: (input) => new TextDecoder().decode(base64ToBytes(input.trim())),
  },
  {
    id: 'url-encode',
    name: 'Text → URL Encode',
    inputFormat: 'text',
    outputFormat: 'url-encoded',
    convert: (input) => encodeURIComponent(input),
  },
  {
    id: 'url-decode',
    name: 'URL Decode → Text',
    inputFormat: 'url-encoded',
    outputFormat: 'text',
    convert: (input) => decodeURIComponent(input),
  },
  {
    id: 'uppercase',
    name: 'UPPERCASE',
    inputFormat: 'text',
    outputFormat: 'text',
    convert: (input) => input.toUpperCase(),
  },
  {
    id: 'lowercase',
    name: 'lowercase',
    inputFormat: 'text',
    outputFormat: 'text',
    convert: (input) => input.toLowerCase(),
  },
  {
    id: 'title-case',
    name: 'Title Case',
    inputFormat: 'text',
    outputFormat: 'text',
    convert: (input) => input.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()),
  },
]

export function getConverters(): Converter[] {
  return converters
}

export function findConverter(inputFormat: string, outputFormat: string): Converter | undefined {
  return converters.find(converter => converter.inputFormat === inputFormat && converter.outputFormat === outputFormat)
}

export function getConvertersFrom(inputFormat: string): Converter[] {
  return converters.filter(converter => converter.inputFormat === inputFormat)
}

export function getFormats(): { input: string[]; output: string[] } {
  return {
    input: Array.from(new Set(converters.map(converter => converter.inputFormat))).sort(),
    output: Array.from(new Set(converters.map(converter => converter.outputFormat))).sort(),
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  try {
    const normalized = value.replace(/\s/g, '')
    const binary = atob(normalized)
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    throw new Error('Invalid Base64 input.')
  }
}

function yamlScalar(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  const text = String(value)
  if (!text || /[:#\[\]{},&*!|>'"%@`\n\r\t]|^[-?:]\s/.test(text) || /^(true|false|null|~|[-+]?\d+(\.\d+)?)$/i.test(text)) {
    return JSON.stringify(text)
  }
  return text
}

function jsonToYaml(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)

  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`
    return value.map(item => {
      if (item && typeof item === 'object') {
        return `${pad}-\n${jsonToYaml(item, indent + 1)}`
      }
      return `${pad}- ${yamlScalar(item)}`
    }).join('\n')
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return `${pad}{}`
    return entries.map(([key, child]) => {
      const safeKey = /^[A-Za-z0-9_.-]+$/.test(key) ? key : JSON.stringify(key)
      if (child && typeof child === 'object') {
        return `${pad}${safeKey}:\n${jsonToYaml(child, indent + 1)}`
      }
      return `${pad}${safeKey}: ${yamlScalar(child)}`
    }).join('\n')
  }

  return `${pad}${yamlScalar(value)}`
}

function yamlToJson(yaml: string): unknown {
  const meaningfulLines = yaml
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim() && !raw.trimStart().startsWith('#'))

  if (meaningfulLines.length === 0) return {}

  const root: Record<string, unknown> = {}
  const stack: Array<{ indent: number; value: Record<string, unknown> }> = [{ indent: -1, value: root }]

  for (const { raw, line } of meaningfulLines) {
    const indent = raw.match(/^\s*/)?.[0].length ?? 0
    if (indent % 2 !== 0) throw new Error(`Unsupported YAML indentation on line ${line}; use two-space indentation.`)

    const trimmed = raw.trim()
    if (trimmed.startsWith('- ')) {
      throw new Error(`YAML arrays are not supported by the lightweight parser yet (line ${line}). Use JSON → YAML for arrays.`)
    }

    const separator = trimmed.indexOf(':')
    if (separator <= 0) throw new Error(`Invalid YAML mapping on line ${line}.`)

    const rawKey = trimmed.slice(0, separator).trim()
    const rawValue = trimmed.slice(separator + 1).trim()
    const key = unquoteYaml(rawKey)

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop()
    const parent = stack[stack.length - 1].value

    if (!rawValue) {
      const child: Record<string, unknown> = {}
      parent[key] = child
      stack.push({ indent, value: child })
    } else {
      parent[key] = parseYamlScalar(rawValue)
    }
  }

  return root
}

function unquoteYaml(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function parseYamlScalar(value: string): unknown {
  if (value === 'null' || value === '~') return null
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^[-+]?\d+(\.\d+)?$/.test(value)) return Number(value)
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value) } catch { return value.slice(1, -1) }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  return value
}

function xmlToJson(xml: string): unknown {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) throw new Error('Invalid XML. Check tag names, closing tags, and document structure.')

  const root = doc.documentElement
  if (!root) throw new Error('XML document is empty.')

  function parseNode(node: Element): unknown {
    const attributes = Object.fromEntries(Array.from(node.attributes).map(attribute => [attribute.name, attribute.value]))
    const elementChildren = Array.from(node.children)
    const text = Array.from(node.childNodes)
      .filter(child => child.nodeType === Node.TEXT_NODE)
      .map(child => child.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')

    if (elementChildren.length === 0 && Object.keys(attributes).length === 0) return text

    const result: Record<string, unknown> = {}
    if (Object.keys(attributes).length > 0) result['@attributes'] = attributes
    if (text) result['#text'] = text

    elementChildren.forEach(child => {
      const value = parseNode(child)
      const existing = result[child.tagName]
      if (existing === undefined) result[child.tagName] = value
      else if (Array.isArray(existing)) existing.push(value)
      else result[child.tagName] = [existing, value]
    })

    return result
  }

  return { [root.tagName]: parseNode(root) }
}

function markdownToHtml(input: string): string {
  const escaped = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const lines = escaped.split(/\r?\n/)
  const output: string[] = []
  let inList = false

  const inline = (text: string) => text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')

  lines.forEach(line => {
    const listMatch = line.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      if (!inList) { output.push('<ul>'); inList = true }
      output.push(`<li>${inline(listMatch[1])}</li>`)
      return
    }
    if (inList) { output.push('</ul>'); inList = false }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (line.trim()) {
      output.push(`<p>${inline(line)}</p>`)
    }
  })

  if (inList) output.push('</ul>')
  return output.join('\n')
}

function htmlToMarkdown(input: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')

  const renderNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const element = node as Element
    const content = Array.from(element.childNodes).map(renderNode).join('')
    const tag = element.tagName.toLowerCase()

    if (tag === 'h1') return `# ${content}\n\n`
    if (tag === 'h2') return `## ${content}\n\n`
    if (tag === 'h3') return `### ${content}\n\n`
    if (tag === 'strong' || tag === 'b') return `**${content}**`
    if (tag === 'em' || tag === 'i') return `*${content}*`
    if (tag === 'code') return `\`${content}\``
    if (tag === 'a') return `[${content}](${element.getAttribute('href') ?? ''})`
    if (tag === 'li') return `- ${content.trim()}\n`
    if (tag === 'br') return '\n'
    if (tag === 'p') return `${content.trim()}\n\n`
    if (tag === 'ul' || tag === 'ol' || tag === 'body') return content
    return content
  }

  return renderNode(doc.body).replace(/\n{3,}/g, '\n\n').trim()
}
