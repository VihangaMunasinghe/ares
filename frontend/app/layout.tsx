import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
})

const spaceMono = Space_Mono({ 
  subsets: ["latin"], 
  weight: ['400', '700'],
  variable: "--font-space-mono",
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Mars Mission Optimizer",
  description: "NASA-grade mission optimizer for Mars operations",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} dark`}>
      <body className="antialiased bg-background text-foreground">
        <SidebarProvider>
          <TopBar />
          <div className="flex h-screen overflow-hidden pt-6">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  )
}
