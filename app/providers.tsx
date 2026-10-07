'use client'

import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LoaderProvider } from './context/LoaderContext'
import { UserProvider } from './context/UserContext'
import { ModalProvider } from './context/ModalContext'
import { AuthModal } from '@/components/flow/auth-modal'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <UserProvider>
        <LoaderProvider>
          <ModalProvider>
            {children}
            <AuthModal />
          </ModalProvider>
        </LoaderProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  )
}
