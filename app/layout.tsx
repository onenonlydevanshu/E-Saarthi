import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'ExamPrep AI - Smart Study Assistant',
  description: 'AI-powered exam preparation platform for government and private competitive exams. Plan your studies, track progress, and ace your exams.',
  keywords: ['exam preparation', 'study planner', 'AI tutor', 'UPSC', 'SSC', 'CAT', 'competitive exams', 'mock tests', 'study schedule'],
  authors: [{ name: 'ExamPrep AI' }],
  creator: 'ExamPrep AI',
  publisher: 'ExamPrep AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'ExamPrep AI - Smart Study Assistant',
    description: 'AI-powered exam preparation platform for competitive exams. Plan studies, track progress, take mock tests.',
    siteName: 'ExamPrep AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExamPrep AI - Smart Study Assistant',
    description: 'AI-powered exam preparation for competitive exams',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d12' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.openai.com" />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
