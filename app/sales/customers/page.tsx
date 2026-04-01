'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { Users, Plus, Pencil, Trash2, Phone, Mail, Building2, Search } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', company: '', taxNumber: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/sales/customers')
    setCustomers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', company: '', taxNumber: '' }); setShowModal(true) }
  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', company: c.company || '', taxNumber: c.taxNumber || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await fetch(`/api/sales/customers/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/sales/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false); setShowModal(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    await fetch(`/api/sales/customers/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )
  const active = customers.filter(c => c.status === 'ACTIVE').length

  return (
    <div>
      <Header title="Clients & CRM" subtitle="Gestion de votre portefeuille clients" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="Total clients" value={customers.length} icon={Users} color="blue" />
          <StatsCard title="Clients actifs" value={active} icon={Users} color="green" />
          <StatsCard title="Inactifs" value={customers.length - active} icon={Users} color="orange" />
          <StatsCard title="Nouvelles fiches" value={customers.filter(c => {
            const d = new Date(c.createdAt)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length} subtitle="ce mois" icon={Users} color="purple" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9 w-64" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Nouveau client</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Client</th><th>Entreprise</th><th>Contact</th><th>N° TVA</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Aucun client trouvé</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center justify-center font-bold">
                          {c.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td>
                      {c.company ? (
                        <div className="flex items-center gap-1 text-gray-600"><Building2 size={13} />{c.company}</div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {c.email && <div className="flex items-center gap-1 text-sm text-gray-500"><Mail size={12} />{c.email}</div>}
                        {c.phone && <div className="flex items-center gap-1 text-sm text-gray-500"><Phone size={12} />{c.phone}</div>}
                      </div>
                    </td>
                    <td className="font-mono text-gray-500">{c.taxNumber || '—'}</td>
                    <td><Badge status={c.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le client' : 'Nouveau client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom *</label>
              <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Entreprise</label>
              <input className="input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">N° TVA / SIRET</label>
            <input className="input" value={form.taxNumber} onChange={e => setForm({...form, taxNumber: e.target.value})} />
          </div>
          <div>
            <label className="label">Adresse</label>
            <textarea className="input" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
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
