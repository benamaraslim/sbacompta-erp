import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TrendingUp, Users, Package, ShoppingCart,
  AlertTriangle, Clock, CheckCircle, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/Badge'

async function getDashboardData() {
  const [
    invoiceStats,
    employeeCount,
    lowStockProducts,
    recentInvoices,
    pendingLeaves,
    orderStats,
    recentOrders,
  ] = await Promise.all([
    prisma.invoice.findMany({
      include: { items: true },
      where: { status: { not: 'CANCELLED' } },
    }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: 5,
      orderBy: { stock: 'asc' },
    }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, items: true },
    }),
    prisma.leave.count({ where: { status: 'PENDING' } }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, items: true },
    }),
  ])

  // Calculate invoice totals
  const totalRevenue = invoiceStats.reduce((sum, inv) => {
    const invTotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 + item.taxRate / 100), 0)
    return sum + invTotal
  }, 0)
  const paidRevenue = invoiceStats.filter(i => i.status === 'PAID').reduce((sum, inv) => {
    const invTotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * (1 + item.taxRate / 100), 0)
    return sum + invTotal
  }, 0)
  const overdueCount = invoiceStats.filter(i => i.status === 'OVERDUE').length

  return {
    totalRevenue,
    paidRevenue,
    overdueCount,
    employeeCount,
    lowStockProducts,
    recentInvoices,
    pendingLeaves,
    orderStats,
    recentOrders,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const pendingOrders = data.orderStats.find(s => s.status === 'PENDING')?._count || 0
  const confirmedOrders = data.orderStats.find(s => s.status === 'CONFIRMED')?._count || 0

  return (
    <div>
      <Header title="Tableau de bord" subtitle={`Bienvenue — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} />

      <div className="p-6">
        {/* KPI Cards */}
        <div className="stats-grid">
          <StatsCard
            title="Chiffre d'affaires"
            value={formatCurrency(data.totalRevenue)}
            subtitle="Total facturé (hors annulé)"
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Employés actifs"
            value={data.employeeCount}
            subtitle={`${data.pendingLeaves} congé(s) en attente`}
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Commandes en cours"
            value={pendingOrders + confirmedOrders}
            subtitle={`${pendingOrders} en attente, ${confirmedOrders} confirmées`}
            icon={ShoppingCart}
            color="orange"
          />
          <StatsCard
            title="Factures payées"
            value={formatCurrency(data.paidRevenue)}
            subtitle={data.overdueCount > 0 ? `${data.overdueCount} en retard` : 'Aucun retard'}
            icon={CheckCircle}
            color={data.overdueCount > 0 ? 'red' : 'green'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Dernières factures</h2>
              <Link href="/finance/invoices" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Client</th>
                    <th>Montant</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8">Aucune facture</td></tr>
                  ) : data.recentInvoices.map((invoice) => {
                    const total = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 + i.taxRate / 100), 0)
                    return (
                      <tr key={invoice.id}>
                        <td className="font-medium text-blue-600">
                          <Link href={`/finance/invoices/${invoice.id}`}>{invoice.number}</Link>
                        </td>
                        <td>{invoice.customer.name}</td>
                        <td className="font-medium">{formatCurrency(total)}</td>
                        <td className="text-gray-500">{formatDate(invoice.dueDate)}</td>
                        <td><Badge status={invoice.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts & Quick Stats */}
          <div className="space-y-4">
            {/* Low Stock Alert */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  Stock faible
                </h2>
                <Link href="/inventory/products" className="text-sm text-blue-600 hover:underline">Voir</Link>
              </div>
              <div className="p-4 space-y-3">
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">Aucune alerte</p>
                ) : data.lowStockProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.code}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600">
                      {product.stock} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Leaves */}
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Congés en attente</p>
                  <p className="text-2xl font-bold text-gray-900">{data.pendingLeaves}</p>
                </div>
              </div>
              <Link href="/hr/leaves" className="mt-3 block text-sm text-blue-600 hover:underline">
                Gérer les demandes →
              </Link>
            </div>

            {/* Orders Summary */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Commandes</h3>
              <div className="space-y-2">
                {data.orderStats.map((stat) => (
                  <div key={stat.status} className="flex justify-between items-center text-sm">
                    <Badge status={stat.status} />
                    <span className="font-semibold text-gray-700">{stat._count}</span>
                  </div>
                ))}
                {data.orderStats.length === 0 && (
                  <p className="text-sm text-gray-400">Aucune commande</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card mt-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Dernières commandes</h2>
            <Link href="/sales/orders" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Articles</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-8">Aucune commande</td></tr>
                ) : data.recentOrders.map((order) => {
                  const total = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                  return (
                    <tr key={order.id}>
                      <td className="font-medium text-blue-600">
                        <Link href={`/sales/orders/${order.id}`}>{order.number}</Link>
                      </td>
                      <td>{order.customer.name}</td>
                      <td className="text-gray-500">{order.items.length} article(s)</td>
                      <td className="font-medium">{formatCurrency(total)}</td>
                      <td className="text-gray-500">{formatDate(order.createdAt)}</td>
                      <td><Badge status={order.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
