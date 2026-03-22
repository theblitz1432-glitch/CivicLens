import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import VoiceAgent from '../components/VoiceAgent'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'CivicLens',
  description: 'Empowering Citizens. Ensuring Accountability.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CivicLens',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // ✅ FIX 2 & 3: suppressHydrationWarning prevents dark-class mismatch flash.
    // ThemeProvider adds 'dark' or 'light' to this element at runtime.
    // ALL Tailwind dark: classes now work app-wide because they key off <html>.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CivicLens" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* ✅ Inline script: applies saved theme BEFORE first paint — prevents white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vite-ui-theme') || 'system';
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  root.classList.add(theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      {/* ✅ body gets dark:bg so the background is dark in dark mode too */}
      <body className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
        <Providers>
          {children}
          <VoiceAgent />
        </Providers>
      </body>
    </html>
  )
}