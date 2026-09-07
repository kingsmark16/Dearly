import { randomBytes } from 'node:crypto'

export function createLetterShareToken() {
  return randomBytes(32).toString('base64url')
}
