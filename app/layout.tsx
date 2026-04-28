import type { Metadata } from 'next'
import { Figtree, IBM_Plex_Mono, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['400', '500', '600', '700'], variable: '--font-thai' })

export const metadata: Metadata = { title: 'TaskFlow — AI Task Manager' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${figtree.variable} ${mono.variable} ${notoThai.variable} h-full`}>
      <body className="h-full bg-[#EEF0F4]">{children}</body>
    </html>
  )
}
