export interface Converter {
  id: string
  name: string
  inputFormat: string
  outputFormat: string
  convert: (input: string) => string | Promise<string>
  validate?: (input: string) => boolean
  description?: string
}

const converters: Converter[] = [
  {
    id: 'json-to-csv',
    name: 'JSON → CSV',
    inputFormat: 'json',
    outputFormat: 'csv',
    convert: (input) => {
      const data = JSON.parse(input)
      if (!Array.isArray(data) || data.length === 0) throw new Error('Input must be a JSON array of objects')
      const headers = Object.keys(data[0])
      const csv = [
        headers.join(','),
        ...data.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
      ].join('\n')
      return csv
    },
    validate: (input) => {
      try { JSON.parse(input); return true } catch { return false }
    }
  },
  {
    id: 'csv-to-json',
    name: 'CSV → JSON',
    inputFormat: 'csv',
    outputFormat: 'json',
    convert: (input) => {
      const lines = input.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const result = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = values[i] || '' })
        return obj
      })
      return JSON.stringify(result, null, 2)
    }
  },
  {
    id: 'json-to-yaml',
    name: 'JSON → YAML',
    inputFormat: 'json',
    outputFormat: 'yaml',
    convert: (input) => {
      const data = JSON.parse(input)
      return jsonToYaml(data)
    },
    validate: (input) => {
      try { JSON.parse(input); return true } catch { return false }
    }
  },
  {
    id: 'yaml-to-json',
    name: 'YAML → JSON',
    inputFormat: 'yaml',
    outputFormat: 'json',
    convert: (input) => {
      return JSON.stringify(yamlToJson(input), null, 2)
    }
  },
  {
    id: 'xml-to-json',
    name: 'XML → JSON',
    inputFormat: 'xml',
    outputFormat: 'json',
    convert: (input) => {
      return JSON.stringify(xmlToJson(input), null, 2)
    }
  },
  {
    id: 'markdown-to-html',
    name: 'Markdown → HTML',
    inputFormat: 'markdown',
    outputFormat: 'html',
    convert: (input) => {
      let html = input
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>')
      return html
    }
  },
  {
    id: 'html-to-markdown',
    name: 'HTML → Markdown',
    inputFormat: 'html',
    outputFormat: 'markdown',
    convert: (input) => {
      let md = input
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
      return md.trim()
    }
  },
  {
    id: 'base64-encode',
    name: 'Text → Base64',
    inputFormat: 'text',
    outputFormat: 'base64',
    convert: (input) => btoa(unescape(encodeURIComponent(input)))
  },
  {
    id: 'base64-decode',
    name: 'Base64 → Text',
    inputFormat: 'base64',
    outputFormat: 'text',
    convert: (input) => decodeURIComponent(escape(atob(input.trim())))
  },
  {
    id: 'url-encode',
    name: 'Text → URL Encode',
    inputFormat: 'text',
    outputFormat: 'url-encoded',
    convert: (input) => encodeURIComponent(input)
  },
  {
    id: 'url-decode',
    name: 'URL Decode → Text',
    inputFormat: 'url-encoded',
    outputFormat: 'text',
    convert: (input) => decodeURIComponent(input)
  },
  {
    id: 'uppercase',
    name: 'UPPERCASE',
    inputFormat: 'text',
    outputFormat: 'text',
    convert: (input) => input.toUpperCase()
  },
  {
    id: 'lowercase',
    name: 'lowercase',
    inputFormat: 'text',
    outputFormat: 'text',
    convert: (input) => input.toLowerCase()
  },
  {
    id: 'title-case',
    name: 'Title Case',
    inputFormat: 'text',
    outputFormat: 'text',
    convert: (input) => input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  }
]

export function getConverters(): Converter[] {
  return converters
}

export function findConverter(inputFormat: string, outputFormat: string): Converter | undefined {
  return converters.find(c => c.inputFormat === inputFormat && c.outputFormat === outputFormat)
}

export function getFormats(): { input: string[]; output: string[] } {
  const inputFormats = Array.from(new Set(converters.map(c => c.inputFormat)))
  const outputFormats = Array.from(new Set(converters.map(c => c.outputFormat)))
  return { input: inputFormats.sort(), output: outputFormats.sort() }
}

function jsonToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent)
  if (Array.isArray(obj)) {
    return obj.map(item => `${spaces}- ${jsonToYaml(item, indent + 1).trim()}`).join('\n')
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).map(([key, value]) => {
      const val = jsonToYaml(value, indent + 1)
      return `${spaces}${key}: ${val.startsWith('-') ? '\n' + val : val}`
    }).join('\n')
  }
  if (typeof obj === 'string') return `"${obj}"`
  return String(obj)
}

function yamlToJson(yaml: string): any {
  const lines = yaml.split('\n')
  const result: any = {}
  let current: any = result
  const stack: any[] = [result]
  let currentKey = ''

  for (const line of lines) {
    if (!line.trim()) continue
    const match = line.match(/^(\s*)(- )?(.+)$/)
    if (!match) continue
    const [, indent, isArray, content] = match
    const keyVal = content.split(':')
    if (keyVal.length === 2) {
      const key = keyVal[0].trim()
      const val = keyVal[1].trim()
      if (val) {
        current[currentKey || key] = isArray ? [cleanYamlValue(val)] : cleanYamlValue(val)
      } else {
        if (isArray) {
          const arr: any[] = []
          current[currentKey || key] = arr
          stack.push(current)
          current = arr
          currentKey = key
        } else {
          const obj: any = {}
          current[currentKey || key] = obj
          stack.push(current)
          current = obj
          currentKey = key
        }
      }
    }
  }
  return result
}

function cleanYamlValue(val: string): any {
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1)
  if (val === 'true') return true
  if (val === 'false') return false
  if (!isNaN(Number(val))) return Number(val)
  return val
}

function xmlToJson(xml: string): any {
  const result: any = {}
  const stack: any[] = [result]
  let current: any = result
  let currentKey = ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const root = doc.documentElement

  function parseNode(node: Element): any {
    const obj: any = {}
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() || ''
    }
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const key = child.nodeName
        const value = parseNode(child as Element)
        if (obj[key]) {
          if (!Array.isArray(obj[key])) obj[key] = [obj[key]]
          obj[key].push(value)
        } else {
          obj[key] = value
        }
      }
    })
    return obj
  }

  const parsed = parseNode(root)
  return { [root.nodeName]: parsed }
}
