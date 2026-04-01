import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import Badge from '@/components/Badge'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, TrendingUp, CheckCircle, Clock } from 'lucide-react'

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  CHECK: 'Chèque',
  CREDIT_CARD: 'Carte bancaire',
  OTHER: 'Autre',
}

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { date: 'desc' },
    include: {
      invoice: {
        include: { customer: true, items: true },
      },
    },
  })

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const thisMonth = payments.filter(p => {
    const d = new Date(p.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((s, p) => s + p.amount, 0)

  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount
    return acc
  }, {} as Record<string, number>)

  const topMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0]

  return (
    <div>
      <Header title="Paiements" subtitle="Historique de tous les règlements reçus" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="Total encaissé" value={formatCurrency(totalPaid)} icon={TrendingUp} color="green" />
          <StatsCard title="Ce mois-ci" value={formatCurrency(thisMonthTotal)} subtitle={`${thisMonth.length} paiement(s)`} icon={CreditCard} color="blue" />
          <StatsCard title="Nombre total" value={payments.length} subtitle="paiements enregistrés" icon={CheckCircle} color="purple" />
          <StatsCard
            title="Méthode principale"
            value={topMethod ? METHOD_LABELS[topMethod[0]] || topMethod[0] : '—'}
            subtitle={topMethod ? formatCurrency(topMethod[1]) : ''}
            icon={Clock}
            color="orange"
          />
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tous les paiements</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Facture</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Référence</th>
                  <th>Statut facture</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Aucun paiement enregistré</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-gray-500">{formatDate(payment.date)}</td>
                    <td className="font-medium text-blue-600">{payment.invoice.number}</td>
                    <td>{payment.invoice.customer.name}</td>
                    <td className="font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                    <td>{METHOD_LABELS[payment.method] || payment.method}</td>
                    <td className="text-gray-400">{payment.reference || '—'}</td>
                    <td><Badge status={payment.invoice.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
