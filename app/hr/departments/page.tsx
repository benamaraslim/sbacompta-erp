'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Modal from '@/components/Modal'
import { Building2, Plus, Users, Pencil, Trash2 } from 'lucide-react'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/hr/departments')
    setDepartments(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true) }
  const openEdit = (dept: any) => { setEditing(dept); setForm({ name: dept.name, description: dept.description || '' }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await fetch(`/api/hr/departments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/hr/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce département ?')) return
    await fetch(`/api/hr/departments/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <Header title="Départements" subtitle="Organisation des services de l'entreprise" />
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nouveau département
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-10">Chargement...</p>
        ) : departments.length === 0 ? (
          <div className="card p-10 text-center">
            <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Aucun département créé</p>
            <button className="btn-primary mt-4" onClick={openCreate}>Créer le premier département</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => (
              <div key={dept.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                      <Building2 size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      {dept.description && <p className="text-sm text-gray-500 mt-0.5">{dept.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => openEdit(dept)}>
                      <Pencil size={15} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(dept.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{dept._count?.employees || dept.employees?.length || 0} employé(s)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le département' : 'Nouveau département'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom du département *</label>
            <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Comptabilité, Informatique..." />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description du département..." />
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
