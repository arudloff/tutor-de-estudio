import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Socrates',
  description: 'Tutor doctoral basado en IA que aplica los 6 principios pedagogicos del A9',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
