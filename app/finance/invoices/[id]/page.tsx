'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  Plus,
  Trash2,
  Printer,
  CreditCard,
} from 'lucide-react'
import Header from '@/components/Header'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDateTime, calcInvoiceTotal } from '@/lib/utils'

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'OTHER'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
  CREDIT_CARD: 'Carte de crédit',
  OTHER: 'Autre',
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  reference?: string
  date: string
  notes?: string
  createdAt: string
}

interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  notes?: string
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
    company?: string
    address?: string
    taxNumber?: string
  }
  items: InvoiceItem[]
  payments: Payment[]
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [payReference, setPayReference] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payNotes, setPayNotes] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchInvoice = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}`)
      if (!res.ok) {
        setError('Facture introuvable')
        return
      }
      const data = await res.json()
      setInvoice(data)
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const updateStatus = async (status: InvoiceStatus) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddPayment = async () => {
    setPayError('')
    if (!payAmount || Number(payAmount) <= 0) {
      setPayError('Veuillez saisir un montant valide.')
      return
    }
    setPayLoading(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          method: payMethod,
          reference: payReference,
          date: payDate,
          notes: payNotes,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setPayError(err.error || 'Erreur lors du paiement.')
        return
      }
      const data = await res.json()
      setInvoice(data.invoice)
      setShowPaymentModal(false)
      setPayAmount('')
      setPayReference('')
      setPayNotes('')
    } catch {
      setPayError('Erreur réseau.')
    } finally {
      setPayLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/finance/invoices')
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Détail facture" />
        <div className="p-6 text-center text-gray-400 py-20">Chargement...</div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div>
        <Header title="Détail facture" />
        <div className="p-6 text-center text-red-500 py-20">{error || 'Facture introuvable'}</div>
      </div>
    )
  }

  const { subtotal, tax, total } = calcInvoiceTotal(invoice.items)
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const remaining = total - totalPaid

  return (
    <div>
      <Header
        title={`Facture ${invoice.number}`}
        subtitle={`${invoice.customer.name}${invoice.customer.company ? ` — ${invoice.customer.company}` : ''}`}
      />

      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/finance/invoices')}
            className="btn-secondary"
          >
            <ArrowLeft size={16} />
            Retour
          </button>

          <div className="flex items-center gap-3">
            <Badge status={invoice.status} />

            {invoice.status === 'DRAFT' && (
              <button
                onClick={() => updateStatus('SENT')}
                disabled={actionLoading}
                className="btn-primary"
              >
                <Send size={16} />
                Marquer envoyé
              </button>
            )}
            {['SENT', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary"
              >
                <CreditCard size={16} />
                Ajouter paiement
              </button>
            )}
            {invoice.status === 'SENT' && (
              <button
                onClick={() => updateStatus('PAID')}
                disabled={actionLoading}
                className="btn btn-success bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Marquer payé
              </button>
            )}
            {!['PAID', 'CANCELLED'].includes(invoice.status) && (
              <button
                onClick={() => updateStatus('CANCELLED')}
                disabled={actionLoading}
                className="btn-danger"
              >
                Annuler
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading}
              className="btn-secondary text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice info */}
            <div className="card p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Informations client
                  </h3>
                  <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
                  {invoice.customer.company && (
                    <p className="text-sm text-gray-600">{invoice.customer.company}</p>
                  )}
                  {invoice.customer.email && (
                    <p className="text-sm text-gray-500">{invoice.customer.email}</p>
                  )}
                  {invoice.customer.phone && (
                    <p className="text-sm text-gray-500">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer.address && (
                    <p className="text-sm text-gray-500 mt-1">{invoice.customer.address}</p>
                  )}
                  {invoice.customer.taxNumber && (
                    <p className="text-xs text-gray-400 mt-1">N° TVA : {invoice.customer.taxNumber}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Détails facture
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Numéro</span>
                      <span className="font-medium">{invoice.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date d'émission</span>
                      <span>{formatDate(invoice.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Échéance</span>
                      <span
                        className={
                          invoice.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''
                        }
                      >
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Statut</span>
                      <Badge status={invoice.status} />
                    </div>
                  </div>
                </div>
              </div>
              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Notes</p>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Articles</h3>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-right">Quantité</th>
                      <th className="text-right">Prix HT</th>
                      <th className="text-right">TVA %</th>
                      <th className="text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => {
                      const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100)
                      return (
                        <tr key={item.id}>
                          <td className="font-medium">{item.description}</td>
                          <td className="text-right text-gray-600">{item.quantity}</td>
                          <td className="text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right text-gray-600">{item.taxRate}%</td>
                          <td className="text-right font-medium">{formatCurrency(lineTotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Totals */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="ml-auto max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total HT</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TVA</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                    <span>Total TTC</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {totalPaid > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Payé</span>
                        <span>{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2">
                        <span>Reste à payer</span>
                        <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Payments */}
          <div className="space-y-6">
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Paiements</h3>
                {['SENT', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="btn-secondary text-xs py-1 px-2 gap-1"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {invoice.payments.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">Aucun paiement enregistré</p>
                ) : (
                  invoice.payments.map((payment) => (
                    <div key={payment.id} className="px-5 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {PAYMENT_METHOD_LABELS[payment.method]}
                            {payment.reference ? ` — ${payment.reference}` : ''}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-gray-400 mt-0.5">{payment.notes}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{formatDate(payment.date)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {invoice.payments.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total payé</span>
                    <span className="text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-sm font-semibold mt-1">
                      <span>Reste dû</span>
                      <span className="text-red-600">{formatCurrency(remaining)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setPayError('')
        }}
        title="Enregistrer un paiement"
        size="md"
      >
        <div className="space-y-4">
          {payError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {payError}
            </div>
          )}
          <div>
            <label className="label">Montant *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder={`Max : ${formatCurrency(remaining)}`}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Mode de paiement *</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="input"
            >
              {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Référence</label>
            <input
              type="text"
              placeholder="N° de virement, chèque..."
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="input resize-none"
              placeholder="Remarques optionnelles..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowPaymentModal(false)
                setPayError('')
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button onClick={handleAddPayment} disabled={payLoading} className="btn-primary">
              {payLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer la facture"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer la facture{' '}
            <span className="font-semibold">{invoice.number}</span> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
              Annuler
            </button>
            <button onClick={handleDelete} disabled={actionLoading} className="btn-danger">
              {actionLoading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
