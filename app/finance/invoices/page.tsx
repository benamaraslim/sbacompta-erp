'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react'
import Header from '@/components/Header'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, calcInvoiceTotal } from '@/lib/utils'

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

interface Customer {
  id: string
  name: string
  email?: string
  company?: string
}

interface Invoice {
  id: string
  number: string
  customer: Customer
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  notes?: string
}

interface NewItem {
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

const STATUS_FILTER_LABELS: Record<string, string> = {
  ALL: 'Tous',
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  PARTIAL: 'Partiel',
  PAID: 'Payé',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulé',
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])

  // Create form state
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formItems, setFormItems] = useState<NewItem[]>([
    { description: '', quantity: '1', unitPrice: '', taxRate: '20' },
  ])
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      const res = await fetch(`/api/finance/invoices?${params}`)
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    fetch('/api/customers')
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => setCustomers([]))
  }, [])

  const getInvoiceTotal = (items: InvoiceItem[]) => calcInvoiceTotal(items).total

  const stats = {
    total: invoices.reduce((s, inv) => s + getInvoiceTotal(inv.items), 0),
    paid: invoices
      .filter((i) => i.status === 'PAID')
      .reduce((s, inv) => s + getInvoiceTotal(inv.items), 0),
    pending: invoices
      .filter((i) => ['DRAFT', 'SENT', 'PARTIAL'].includes(i.status))
      .reduce((s, inv) => s + getInvoiceTotal(inv.items), 0),
    overdue: invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((s, inv) => s + getInvoiceTotal(inv.items), 0),
  }

  const addItem = () =>
    setFormItems((prev) => [
      ...prev,
      { description: '', quantity: '1', unitPrice: '', taxRate: '20' },
    ])

  const removeItem = (index: number) =>
    setFormItems((prev) => prev.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof NewItem, value: string) => {
    setFormItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleCreate = async () => {
    setFormError('')
    if (!formCustomerId || !formDueDate) {
      setFormError('Veuillez sélectionner un client et une date d\'échéance.')
      return
    }
    if (formItems.some((it) => !it.description || !it.unitPrice)) {
      setFormError('Tous les articles doivent avoir une description et un prix.')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formCustomerId,
          dueDate: formDueDate,
          notes: formNotes,
          items: formItems.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            taxRate: Number(it.taxRate),
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Erreur lors de la création.')
        return
      }
      setShowCreateModal(false)
      setFormCustomerId('')
      setFormDueDate('')
      setFormNotes('')
      setFormItems([{ description: '', quantity: '1', unitPrice: '', taxRate: '20' }])
      fetchInvoices()
    } catch {
      setFormError('Erreur réseau.')
    } finally {
      setFormLoading(false)
    }
  }

  const previewTotal = calcInvoiceTotal(
    formItems.map((it) => ({
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unitPrice) || 0,
      taxRate: Number(it.taxRate) || 0,
    }))
  )

  return (
    <div>
      <Header title="Factures" subtitle="Gestion des factures clients" />
      <div className="p-6">
        {/* Stats */}
        <div className="stats-grid">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total facturé</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{invoices.length} facture(s)</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <FileText size={22} />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Encaissé</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.paid)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {invoices.filter((i) => i.status === 'PAID').length} payée(s)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 text-green-600">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">En attente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.pending)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {invoices.filter((i) => ['DRAFT', 'SENT', 'PARTIAL'].includes(i.status)).length} en cours
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
                <Clock size={22} />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">En retard</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.overdue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {invoices.filter((i) => i.status === 'OVERDUE').length} en retard
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <AlertCircle size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card mb-4">
          <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-auto"
              >
                {Object.entries(STATUS_FILTER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary whitespace-nowrap"
            >
              <Plus size={16} />
              Nouvelle facture
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Total TTC</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Chargement...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Aucune facture trouvée
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/finance/invoices/${inv.id}`)}
                    >
                      <td className="font-medium text-blue-600">{inv.number}</td>
                      <td>
                        <div className="font-medium text-gray-900">{inv.customer.name}</div>
                        {inv.customer.company && (
                          <div className="text-xs text-gray-400">{inv.customer.company}</div>
                        )}
                      </td>
                      <td className="font-semibold">{formatCurrency(getInvoiceTotal(inv.items))}</td>
                      <td className="text-gray-600">{formatDate(inv.dueDate)}</td>
                      <td>
                        <Badge status={inv.status} />
                      </td>
                      <td>
                        <ChevronRight size={16} className="text-gray-400" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setFormError('')
        }}
        title="Nouvelle facture"
        size="xl"
      >
        <div className="space-y-5">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(e.target.value)}
                className="input"
              >
                <option value="">Sélectionner un client</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` — ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date d'échéance *</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Notes ou conditions de paiement..."
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Articles *</label>
              <button onClick={addItem} className="btn-secondary text-xs py-1 px-2 gap-1">
                <Plus size={12} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {formItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    {idx === 0 && <p className="text-xs text-gray-500 mb-1">Description</p>}
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <p className="text-xs text-gray-500 mb-1">Qté</p>}
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <p className="text-xs text-gray-500 mb-1">Prix HT</p>}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <p className="text-xs text-gray-500 mb-1">TVA %</p>}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.taxRate}
                      onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className={`col-span-1 ${idx === 0 ? 'mt-5' : ''} flex justify-center`}>
                    {formItems.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview totals */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total HT</span>
              <span>{formatCurrency(previewTotal.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA</span>
              <span>{formatCurrency(previewTotal.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
              <span>Total TTC</span>
              <span>{formatCurrency(previewTotal.total)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowCreateModal(false)
                setFormError('')
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button onClick={handleCreate} disabled={formLoading} className="btn-primary">
              {formLoading ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
