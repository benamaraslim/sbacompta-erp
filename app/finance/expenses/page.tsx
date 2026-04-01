'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, Plus, TrendingDown, CheckCircle, Clock } from 'lucide-react'

const CATEGORIES = [
  { value: 'TRAVEL', label: 'Déplacement' },
  { value: 'OFFICE', label: 'Bureau' },
  { value: 'UTILITIES', label: 'Services' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EQUIPMENT', label: 'Équipement' },
  { value: 'SERVICES', label: 'Prestations' },
  { value: 'OTHER', label: 'Autre' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', category: 'OFFICE', date: new Date().toISOString().slice(0, 10), description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/finance/expenses')
    const data = await res.json()
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    setSaving(false)
    setShowModal(false)
    setForm({ title: '', amount: '', category: 'OFFICE', date: new Date().toISOString().slice(0, 10), description: '' })
    load()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/finance/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return
    await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' })
    load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const pending = expenses.filter(e => e.status === 'PENDING')
  const approved = expenses.filter(e => e.status === 'APPROVED' || e.status === 'PAID')

  return (
    <div>
      <Header title="Dépenses" subtitle="Gestion des notes de frais et dépenses" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="Total dépenses" value={formatCurrency(total)} icon={TrendingDown} color="red" />
          <StatsCard title="En attente" value={pending.length} subtitle={formatCurrency(pending.reduce((s, e) => s + e.amount, 0))} icon={Clock} color="orange" />
          <StatsCard title="Approuvées" value={approved.length} subtitle={formatCurrency(approved.reduce((s, e) => s + e.amount, 0))} icon={CheckCircle} color="green" />
          <StatsCard title="Catégories" value={new Set(expenses.map(e => e.category)).size} subtitle="types de dépenses" icon={Wallet} color="blue" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Toutes les dépenses</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nouvelle dépense
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Aucune dépense</td></tr>
                ) : expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="font-medium">{expense.title}</td>
                    <td>{CATEGORY_LABELS[expense.category] || expense.category}</td>
                    <td className="font-bold text-red-600">{formatCurrency(expense.amount)}</td>
                    <td className="text-gray-500">{formatDate(expense.date)}</td>
                    <td><Badge status={expense.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        {expense.status === 'PENDING' && (
                          <>
                            <button className="text-xs text-green-600 hover:underline" onClick={() => handleStatusChange(expense.id, 'APPROVED')}>Approuver</button>
                            <button className="text-xs text-red-600 hover:underline" onClick={() => handleStatusChange(expense.id, 'REJECTED')}>Refuser</button>
                          </>
                        )}
                        {expense.status === 'APPROVED' && (
                          <button className="text-xs text-blue-600 hover:underline" onClick={() => handleStatusChange(expense.id, 'PAID')}>Marquer payé</button>
                        )}
                        <button className="text-xs text-gray-400 hover:underline" onClick={() => handleDelete(expense.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle dépense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Titre *</label>
            <input className="input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Titre de la dépense" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Montant (€) *</label>
              <input className="input" type="number" step="0.01" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Catégorie *</label>
            <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description optionnelle..." />
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
