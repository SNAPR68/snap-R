/**
 * Embed Layout — Minimal layout for embeddable widgets.
 * No nav, no footer, no chatbot, no cookie consent.
 */

import '@/app/globals.css'

export const metadata = {
  title: 'SnapR Widget',
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-transparent m-0 p-0">
        {children}
      </body>
    </html>
  )
}
