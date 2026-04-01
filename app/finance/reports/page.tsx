import Header from '@/components/Header'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default async function ReportsPage() {
  const currentYear = new Date().getFullYear()

  const [invoices, expenses, customers] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: { items: true, customer: true },
    }),
    prisma.expense.findMany({ where: { status: { not: 'REJECTED' } } }),
    prisma.customer.findMany({ include: { invoices: { include: { items: true } } } }),
  ])

  // Monthly revenue for current year
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.createdAt)
      return d.getFullYear() === currentYear && d.getMonth() === i
    })
    return monthInvoices.reduce((sum, inv) =>
      sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 + item.taxRate / 100), 0), 0
    )
  })

  const maxRevenue = Math.max(...monthlyRevenue, 1)

  // Monthly expenses
  const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
    return expenses.filter(exp => {
      const d = new Date(exp.date)
      return d.getFullYear() === currentYear && d.getMonth() === i
    }).reduce((sum, e) => sum + e.amount, 0)
  })

  // Expense by category
  const expenseByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  const CATEGORY_LABELS: Record<string, string> = {
    TRAVEL: 'Déplacement', OFFICE: 'Bureau', UTILITIES: 'Services',
    MARKETING: 'Marketing', EQUIPMENT: 'Équipement', SERVICES: 'Prestations', OTHER: 'Autre',
  }

  // Top customers by revenue
  const customerRevenue = customers.map(c => ({
    name: c.name,
    revenue: c.invoices.reduce((sum, inv) =>
      sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 + item.taxRate / 100), 0), 0
    ),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const totalRevenue = monthlyRevenue.reduce((s, v) => s + v, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const paidInvoices = invoices.filter(i => i.status === 'PAID')
  const paidRevenue = paidInvoices.reduce((sum, inv) =>
    sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 + item.taxRate / 100), 0), 0
  )

  return (
    <div>
      <Header title="Rapports financiers" subtitle={`Exercice ${currentYear}`} />
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp size={18} className="text-blue-500" />
              <span className="text-sm text-gray-500">CA Facturé</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-1">
              <DollarSign size={18} className="text-green-500" />
              <span className="text-sm text-gray-500">CA Encaissé</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(paidRevenue)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-1">
              <TrendingDown size={18} className="text-red-500" />
              <span className="text-sm text-gray-500">Total Dépenses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp size={18} className="text-purple-500" />
              <span className="text-sm text-gray-500">Résultat net</span>
            </div>
            <p className={`text-2xl font-bold ${paidRevenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(paidRevenue - totalExpenses)}
            </p>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Chiffre d'affaires mensuel {currentYear}</h2>
          <div className="flex items-end gap-2 h-48">
            {monthlyRevenue.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">
                  {val > 0 ? formatCurrency(val).replace('EUR', '').trim() : ''}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: '140px' }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-gray-500">{MONTH_NAMES[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Dépenses par catégorie</h2>
            {Object.keys(expenseByCategory).length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune dépense enregistrée</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expenseByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = Math.round((amount / totalExpenses) * 100)
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{CATEGORY_LABELS[cat] || cat}</span>
                          <span className="font-medium">{formatCurrency(amount)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-red-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Top 5 clients par CA</h2>
            {customerRevenue.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune donnée client</p>
            ) : (
              <div className="space-y-3">
                {customerRevenue.map((c, i) => {
                  const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <span className="text-gray-700 font-medium">{c.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(c.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
