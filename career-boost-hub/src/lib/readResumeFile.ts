export const MAX_BYTES = 5 * 1024 * 1024
export const MAX_PDF_PAGES = 20

const MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
}

/** Returns an error message, or null when the file is acceptable. Extension AND (when the browser reports one) MIME must agree. */
export function validateResumeFile(f: { name: string; size: number; type: string }): string | null {
  const ext = f.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ''
  if (!MIME[ext]) return 'Unsupported file type. Please upload a .pdf, .docx or .txt file.'
  if (f.type && !MIME[ext].includes(f.type)) return `That file's type doesn't match its .${ext} extension.`
  if (f.size === 0) return 'That file is empty.'
  if (f.size > MAX_BYTES) return 'File is too large (max 5 MB).'
  return null
}

/** Collapse extracted text: drop control chars, tidy spaces, cap blank lines. */
export function normalizeText(t: string): string {
  return t
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Extract plain text (never HTML) from a validated resume file. Heavy libs are loaded on demand. */
export async function readResumeFile(file: File): Promise<string> {
  const err = validateResumeFile(file)
  if (err) throw new Error(err)
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'txt') return normalizeText(await file.text())
  const buf = await file.arrayBuffer()
  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    return normalizeText((await mammoth.extractRawText({ arrayBuffer: buf })).value)
  }
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const task = pdfjs.getDocument({ data: new Uint8Array(buf) })
  const doc = await task.promise
  try {
    const pages: string[] = []
    for (let i = 1; i <= Math.min(doc.numPages, MAX_PDF_PAGES); i++) {
      const tc = await (await doc.getPage(i)).getTextContent()
      pages.push(tc.items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join(''))
    }
    return normalizeText(pages.join('\n\n'))
  } finally {
    void task.destroy()
  }
}
