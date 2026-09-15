export const copyText = async (text) => {
  const value = String(text).replace(/\u00a0/g, ' ').trim()

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Some browsers block the Clipboard API outside a trusted user gesture
      // or without permission. Fall through to the textarea method.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.width = '1px'
  textarea.style.height = '1px'
  textarea.style.padding = '0'
  textarea.style.border = 'none'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, value.length)
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) {
    throw new Error('Copy failed')
  }
}

export const downloadBlob = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export const downloadTextFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, filename)
}

export const downloadFromUrl = async (url, filename) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not download ${filename}`)
  }
  const blob = await response.blob()
  downloadBlob(blob, filename)
}
