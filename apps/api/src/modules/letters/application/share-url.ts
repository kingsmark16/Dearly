export function createLetterShareUrl(webOrigin: string, shareToken: string) {
  const origin = webOrigin.split(',')[0]?.trim()

  if (!origin) {
    throw new Error('WEB_ORIGIN must contain at least one web origin')
  }

  return new URL(`/letters/${shareToken}`, origin).toString()
}
