'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Modal from '@/components/Modal'
import StatsCard from '@/components/StatsCard'
import { formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, Plus, BarChart3 } from 'lucide-react'

const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Entrée stock' },
  { value: 'OUT', label: 'Sortie stock' },
  { value: 'ADJUSTMENT', label: 'Ajustement' },
  { value: 'RETURN', label: 'Retour' },
]

const TYPE_STYLES: Record<string, string> = {
  IN: 'text-green-600',
  OUT: 'text-red-600',
  ADJUSTMENT: 'text-blue-600',
  TRANSFER: 'text-purple-600',
  RETURN: 'text-orange-600',
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [movRes, prodRes] = await Promise.all([
      fetch('/api/inventory/movements'),
      fetch('/api/inventory/products'),
    ])
    setMovements(await movRes.json())
    setProducts(await prodRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity) }),
    })
    setSaving(false); setShowModal(false)
    setForm({ productId: '', type: 'IN', quantity: '', reason: '' })
    load()
  }

  const totalIn = movements.filter(m => m.type === 'IN' || m.type === 'RETURN').reduce((s, m) => s + m.quantity, 0)
  const totalOut = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0)

  return (
    <div>
      <Header title="Mouvements de stock" subtitle="Entrées, sorties et ajustements" />
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard title="Total entrées" value={totalIn} subtitle="unités reçues" icon={ArrowDownCircle} color="green" />
          <StatsCard title="Total sorties" value={totalOut} subtitle="unités sorties" icon={ArrowUpCircle} color="red" />
          <StatsCard title="Mouvements" value={movements.length} subtitle="opérations enregistrées" icon={BarChart3} color="blue" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Historique des mouvements</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nouveau mouvement
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th><th>Motif</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">Aucun mouvement</td></tr>
                ) : movements.map(m => (
                  <tr key={m.id}>
                    <td className="text-gray-500">{formatDate(m.date)}</td>
                    <td>
                      <p className="font-medium">{m.product?.name}</p>
                      <p className="text-xs text-gray-400">{m.product?.code}</p>
                    </td>
                    <td>
                      <span className={`font-medium ${TYPE_STYLES[m.type] || 'text-gray-600'}`}>
                        {m.type === 'IN' ? '↑ Entrée' : m.type === 'OUT' ? '↓ Sortie' : m.type === 'ADJUSTMENT' ? '~ Ajustement' : m.type === 'RETURN' ? '↩ Retour' : m.type}
                      </span>
                    </td>
                    <td className={`font-bold ${TYPE_STYLES[m.type]}`}>
                      {m.type === 'OUT' ? '-' : '+'}{m.quantity} {m.product?.unit}
                    </td>
                    <td className="text-gray-500">{m.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau mouvement de stock" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Produit *</label>
            <select className="input" required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
              <option value="">Sélectionner un produit</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — Stock: {p.stock} {p.unit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantité *</label>
            <input className="input" type="number" step="0.01" min="0.01" required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>
          <div>
            <label className="label">Motif</label>
            <input className="input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Ex: Réception commande, Retour client..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
