import type { Metadata } from 'next'
import { Figtree, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata: Metadata = { title: 'TaskFlow — AI Task Manager' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${mono.variable} h-full`}>
      <body className="h-full bg-[#EEF0F4]">{children}</body>
    </html>
  )
}
