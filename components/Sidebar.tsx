'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  UserCheck,
  Calendar,
  Wallet,
  BarChart3,
  Truck,
  ClipboardList,
  Building2,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    label: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Finance',
    icon: TrendingUp,
    color: 'text-blue-600',
    children: [
      { label: 'Factures', href: '/finance/invoices', icon: Receipt },
      { label: 'Paiements', href: '/finance/payments', icon: CreditCard },
      { label: 'Dépenses', href: '/finance/expenses', icon: Wallet },
      { label: 'Rapports', href: '/finance/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Ressources Humaines',
    icon: Users,
    color: 'text-purple-600',
    children: [
      { label: 'Employés', href: '/hr/employees', icon: UserCheck },
      { label: 'Présences', href: '/hr/attendance', icon: Calendar },
      { label: 'Congés', href: '/hr/leaves', icon: Calendar },
      { label: 'Paie', href: '/hr/payroll', icon: Wallet },
      { label: 'Départements', href: '/hr/departments', icon: Building2 },
    ],
  },
  {
    label: 'Stock & Inventaire',
    icon: Package,
    color: 'text-green-600',
    children: [
      { label: 'Produits', href: '/inventory/products', icon: Package },
      { label: 'Mouvements', href: '/inventory/movements', icon: BarChart3 },
      { label: 'Fournisseurs', href: '/inventory/suppliers', icon: Truck },
      { label: 'Achats', href: '/inventory/purchases', icon: ClipboardList },
    ],
  },
  {
    label: 'Ventes & CRM',
    icon: ShoppingCart,
    color: 'text-orange-600',
    children: [
      { label: 'Clients', href: '/sales/customers', icon: Users },
      { label: 'Devis', href: '/sales/quotes', icon: ClipboardList },
      { label: 'Commandes', href: '/sales/orders', icon: ShoppingCart },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>(['Finance', 'Ressources Humaines', 'Stock & Inventaire', 'Ventes & CRM'])

  const toggleSection = (label: string) => {
    setOpenSections(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    )
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
          ERP
        </div>
        <div>
          <div className="font-bold text-sm">SBACOMPTA</div>
          <div className="text-xs text-gray-400">Gestion d'entreprise</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navigation.map((item) => {
          if (!item.children) {
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors',
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          }

          const isOpen = openSections.includes(item.label)
          const isActive = item.children.some(child => pathname.startsWith(child.href))

          return (
            <div key={item.label} className="mb-1">
              <button
                onClick={() => toggleSection(item.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon size={18} className={item.color} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform text-gray-400', isOpen ? 'rotate-180' : '')}
                />
              </button>

              {isOpen && (
                <div className="ml-3 mt-1 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        pathname === child.href
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      <child.icon size={15} />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        SBACOMPTA v1.0 &copy; {new Date().getFullYear()}
      </div>
    </aside>
  )
}
