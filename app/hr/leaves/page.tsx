'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import StatsCard from '@/components/StatsCard'
import { formatDate } from '@/lib/utils'
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Congé annuel' },
  { value: 'SICK', label: 'Maladie' },
  { value: 'MATERNITY', label: 'Maternité' },
  { value: 'PATERNITY', label: 'Paternité' },
  { value: 'UNPAID', label: 'Sans solde' },
  { value: 'OTHER', label: 'Autre' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(LEAVE_TYPES.map(t => [t.value, t.label]))

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState({
    employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: ''
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [leavesRes, empRes] = await Promise.all([
      fetch('/api/hr/leaves'),
      fetch('/api/hr/employees'),
    ])
    setLeaves(await leavesRes.json())
    setEmployees(await empRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAction = async (id: string, status: string) => {
    await fetch(`/api/hr/leaves/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette demande ?')) return
    await fetch(`/api/hr/leaves/${id}`, { method: 'DELETE' })
    load()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    await fetch('/api/hr/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, days }),
    })
    setSaving(false)
    setShowModal(false)
    setForm({ employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
    load()
  }

  const filtered = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter)
  const pending = leaves.filter(l => l.status === 'PENDING')
  const approved = leaves.filter(l => l.status === 'APPROVED')

  return (
    <div>
      <Header title="Congés & Absences" subtitle="Gestion des demandes de congé" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="En attente" value={pending.length} subtitle="demandes à traiter" icon={Clock} color="orange" />
          <StatsCard title="Approuvés" value={approved.length} subtitle="ce mois" icon={CheckCircle} color="green" />
          <StatsCard title="Total demandes" value={leaves.length} icon={Calendar} color="blue" />
          <StatsCard title="Jours pris" value={approved.reduce((s, l) => s + l.days, 0)} subtitle="jours approuvés" icon={Calendar} color="purple" />
        </div>

        {/* Pending section */}
        {pending.length > 0 && (
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 rounded-t-xl">
              <h2 className="font-semibold text-orange-700 flex items-center gap-2">
                <Clock size={16} /> {pending.length} demande(s) en attente d'approbation
              </h2>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Employé</th><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Motif</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pending.map(leave => (
                    <tr key={leave.id}>
                      <td className="font-medium">{leave.employee?.firstName} {leave.employee?.lastName}</td>
                      <td>{TYPE_LABELS[leave.type] || leave.type}</td>
                      <td>{formatDate(leave.startDate)}</td>
                      <td>{formatDate(leave.endDate)}</td>
                      <td className="font-medium">{leave.days}j</td>
                      <td className="text-gray-500 max-w-xs truncate">{leave.reason || '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-success text-xs py-1 px-3" onClick={() => handleAction(leave.id, 'APPROVED')}>
                            <CheckCircle size={13} /> Approuver
                          </button>
                          <button className="btn-danger text-xs py-1 px-3" onClick={() => handleAction(leave.id, 'REJECTED')}>
                            <XCircle size={13} /> Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All leaves */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900">Toutes les demandes</h2>
              <div className="flex gap-1">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`text-xs px-3 py-1 rounded-full ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s === 'ALL' ? 'Tous' : s === 'PENDING' ? 'En attente' : s === 'APPROVED' ? 'Approuvés' : 'Refusés'}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nouvelle demande
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Employé</th><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Aucune demande</td></tr>
                ) : filtered.map(leave => (
                  <tr key={leave.id}>
                    <td className="font-medium">{leave.employee?.firstName} {leave.employee?.lastName}</td>
                    <td>{TYPE_LABELS[leave.type] || leave.type}</td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td>{formatDate(leave.endDate)}</td>
                    <td>{leave.days}j</td>
                    <td><Badge status={leave.status} /></td>
                    <td>
                      <button className="text-xs text-red-400 hover:underline" onClick={() => handleDelete(leave.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle demande de congé">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Employé *</label>
            <select className="input" required value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
              <option value="">Sélectionner un employé</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.position}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type de congé *</label>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date de début *</label>
              <input type="date" className="input" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div>
              <label className="label">Date de fin *</label>
              <input type="date" className="input" required value={form.endDate} min={form.startDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Motif</label>
            <textarea className="input" rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Motif optionnel..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Envoi...' : 'Soumettre'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
