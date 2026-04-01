'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ClipboardList, Plus, CheckCircle, Send } from 'lucide-react'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    customerId: '',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    notes: '',
    items: [{ description: '', quantity: '1', unitPrice: '' }],
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [qRes, cRes, pRes] = await Promise.all([
      fetch('/api/sales/quotes'),
      fetch('/api/sales/customers'),
      fetch('/api/inventory/products'),
    ])
    setQuotes(await qRes.json())
    setCustomers(await cRes.json())
    setProducts(await pRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addItem = () => setForm({...form, items: [...form.items, { description: '', quantity: '1', unitPrice: '' }]})
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    setForm({...form, items})
  }
  const removeItem = (i: number) => setForm({...form, items: form.items.filter((_, idx) => idx !== i)})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/sales/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: form.customerId,
        validUntil: form.validUntil,
        notes: form.notes,
        items: form.items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
      }),
    })
    setSaving(false); setShowModal(false)
    setForm({ customerId: '', validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), notes: '', items: [{ description: '', quantity: '1', unitPrice: '' }] })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/sales/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const calcTotal = (items: any[]) => items.reduce((s: number, i: any) => s + (i.quantity || 0) * (i.unitPrice || 0), 0)

  const draft = quotes.filter(q => q.status === 'DRAFT').length
  const sent = quotes.filter(q => q.status === 'SENT').length
  const accepted = quotes.filter(q => q.status === 'ACCEPTED').length

  return (
    <div>
      <Header title="Devis" subtitle="Gestion des devis et propositions commerciales" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="Total devis" value={quotes.length} icon={ClipboardList} color="blue" />
          <StatsCard title="Brouillons" value={draft} icon={ClipboardList} color="orange" />
          <StatsCard title="Envoyés" value={sent} icon={Send} color="purple" />
          <StatsCard title="Acceptés" value={accepted} icon={CheckCircle} color="green" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tous les devis</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nouveau devis</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>N°</th><th>Client</th><th>Total HT</th><th>Valide jusqu'au</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : quotes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Aucun devis</td></tr>
                ) : quotes.map(q => (
                  <tr key={q.id}>
                    <td className="font-medium text-blue-600">{q.number}</td>
                    <td>{q.customer?.name}</td>
                    <td className="font-medium">{formatCurrency(calcTotal(q.items || []))}</td>
                    <td className="text-gray-500">{formatDate(q.validUntil)}</td>
                    <td><Badge status={q.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        {q.status === 'DRAFT' && (
                          <button className="text-xs text-blue-600 hover:underline flex items-center gap-1" onClick={() => updateStatus(q.id, 'SENT')}>
                            <Send size={11} /> Envoyer
                          </button>
                        )}
                        {q.status === 'SENT' && (
                          <>
                            <button className="text-xs text-green-600 hover:underline" onClick={() => updateStatus(q.id, 'ACCEPTED')}>Accepter</button>
                            <button className="text-xs text-red-600 hover:underline" onClick={() => updateStatus(q.id, 'REJECTED')}>Refuser</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau devis" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select className="input" required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                <option value="">Sélectionner un client</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valide jusqu'au *</label>
              <input type="date" className="input" required value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="label">Lignes du devis *</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Qté</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Prix unit. €</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <input className="input" required value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description..." />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input" type="number" step="0.01" min="0.01" required value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input" type="number" step="0.01" min="0" required value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                      </td>
                      <td className="px-3 py-1.5 font-medium text-gray-700">
                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                      </td>
                      <td className="px-2">
                        {form.items.length > 1 && (
                          <button type="button" className="text-red-400 hover:text-red-600 text-lg font-bold" onClick={() => removeItem(i)}>×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700">Total HT :</td>
                    <td className="px-3 py-2 font-bold text-gray-900">
                      {formatCurrency(form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button type="button" className="btn-secondary text-sm mt-2" onClick={addItem}>+ Ajouter une ligne</button>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Création...' : 'Créer le devis'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
