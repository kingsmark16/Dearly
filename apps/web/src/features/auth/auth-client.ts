'use client'

import { createAuthClient } from 'better-auth/react'

const localAuthUrl = 'http://127.0.0.1:4000'
const configuredAuthUrl = process.env.NEXT_PUBLIC_AUTH_URL

const authClientOptions = configuredAuthUrl
  ? { baseURL: configuredAuthUrl }
  : process.env.NODE_ENV === 'production'
    ? undefined
    : { baseURL: localAuthUrl }

export const authClient = createAuthClient(authClientOptions)

export const isGoogleSignInEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED === 'true'
