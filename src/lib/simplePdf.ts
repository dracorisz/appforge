const ascii = (value: string) => value
  .normalize('NFKD')
  .replace(/[^\x20-\x7E\n\r\t]/g, '')
  .replace(/\t/g, '    ')

const escapePdf = (value: string) => ascii(value)
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')

const wrapText = (text: string, width = 84) => {
  const lines: string[] = []
  for (const paragraph of ascii(text).split(/\r?\n/)) {
    const clean = paragraph.trim()
    if (!clean) {
      lines.push('')
      continue
    }
    const words = clean.split(/\s+/)
    let line = ''
    for (const word of words) {
      if (!line) {
        line = word.slice(0, width)
        if (word.length > width) {
          lines.push(line)
          line = word.slice(width)
        }
        continue
      }
      if (`${line} ${word}`.length <= width) {
        line += ` ${word}`
      } else {
        lines.push(line)
        line = word.slice(0, width)
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

export function downloadTextPdf({ title, sourceUrl, text, filename }: {
  title: string
  sourceUrl: string
  text: string
  filename: string
}) {
  const header = [title, sourceUrl, '', ...wrapText(text)]
  const pageLineLimit = 50
  const pages: string[][] = []
  for (let i = 0; i < header.length; i += pageLineLimit) pages.push(header.slice(i, i + pageLineLimit))
  if (!pages.length) pages.push([''])

  const objects = new Map<number, string>()
  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>')
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  const pageRefs: number[] = []
  pages.forEach((lines, index) => {
    const pageObj = 4 + index * 2
    const contentObj = pageObj + 1
    pageRefs.push(pageObj)
    const streamLines = lines.map((line) => `(${escapePdf(line)}) Tj\nT*`).join('\n')
    const stream = `BT\n/F1 10 Tf\n13 TL\n48 744 Td\n${streamLines}\nET`
    objects.set(pageObj, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>`)
    objects.set(contentObj, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  objects.set(2, `<< /Type /Pages /Kids [${pageRefs.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`)

  const maxObject = Math.max(...objects.keys())
  let output = '%PDF-1.4\n% AppForge\n'
  const offsets = new Array(maxObject + 1).fill(0)

  for (let id = 1; id <= maxObject; id += 1) {
    const body = objects.get(id) || '<< >>'
    offsets[id] = output.length
    output += `${id} 0 obj\n${body}\nendobj\n`
  }

  const xrefOffset = output.length
  output += `xref\n0 ${maxObject + 1}\n`
  output += '0000000000 65535 f \n'
  for (let id = 1; id <= maxObject; id += 1) {
    output += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  output += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([output], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
