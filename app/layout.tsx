import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Truck Finder',
  description: 'Find trucks and pricing information',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
