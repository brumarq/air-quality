import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { preconnect } from "react-dom"
import "./globals.css"
import { ThemeProvider } from "@/app/_components/theme-provider"
import { API_BASE_URL } from "@/features/air-quality/api"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Luxembourg Air Quality Map",
  description: "Interactive air quality map for Luxembourg",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  preconnect("https://api.mapbox.com", { crossOrigin: "anonymous" })
  preconnect(new URL(API_BASE_URL).origin, { crossOrigin: "anonymous" })
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
