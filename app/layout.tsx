import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'SBACOMPTA - Gestion d\'entreprise',
  description: 'Système ERP complet: Finance, RH, Stock, Ventes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
