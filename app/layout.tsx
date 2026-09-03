import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ingesocc S.A.S. | Visionarios del diseño',
  description: 'Arquitectura, ingeniería y construcción con propósito. Ingesocc crea espacios que trascienden.',
  generator: 'v0.app',
  icons: { icon: '/ingesocc-logo.jpg', apple: '/ingesocc-logo.jpg' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f6f4',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
