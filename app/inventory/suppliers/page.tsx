'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { Truck, Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', taxNumber: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/inventory/suppliers')
    setSuppliers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', taxNumber: '' }); setShowModal(true) }
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', taxNumber: s.taxNumber || '' }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await fetch(`/api/inventory/suppliers/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/inventory/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false); setShowModal(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur ?')) return
    await fetch(`/api/inventory/suppliers/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <Header title="Fournisseurs" subtitle="Gestion des fournisseurs et partenaires" />
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Nouveau fournisseur</button>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Fournisseur</th><th>Contact</th><th>N° TVA</th><th>Adresse</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : suppliers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Aucun fournisseur</td></tr>
                ) : suppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck size={16} className="text-green-600" />
                        </div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {s.email && <div className="flex items-center gap-1 text-sm text-gray-500"><Mail size={12} />{s.email}</div>}
                        {s.phone && <div className="flex items-center gap-1 text-sm text-gray-500"><Phone size={12} />{s.phone}</div>}
                      </div>
                    </td>
                    <td className="text-gray-500 font-mono">{s.taxNumber || '—'}</td>
                    <td className="text-gray-500">{s.address || '—'}</td>
                    <td><Badge status={s.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom *</label>
            <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom du fournisseur" />
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
