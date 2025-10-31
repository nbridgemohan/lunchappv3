import './globals.css'

export const metadata = {
  title: 'Simple Vercel App',
  description: 'A simple Next.js app deployed to Vercel',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
