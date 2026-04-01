'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { formatCurrency } from '@/lib/utils'
import { Package, Plus, AlertTriangle, TrendingUp, Search, Pencil, Trash2 } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    code: '', name: '', description: '', categoryId: '', unit: 'pcs',
    costPrice: '', salePrice: '', stock: '0', minStock: '0',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/inventory/products'),
      fetch('/api/inventory/categories'),
    ])
    setProducts(await prodRes.json())
    setCategories(await catRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', name: '', description: '', categoryId: '', unit: 'pcs', costPrice: '', salePrice: '', stock: '0', minStock: '0' })
    setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({ code: p.code, name: p.name, description: p.description || '', categoryId: p.categoryId || '',
      unit: p.unit, costPrice: String(p.costPrice), salePrice: String(p.salePrice),
      stock: String(p.stock), minStock: String(p.minStock) })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, costPrice: parseFloat(form.costPrice), salePrice: parseFloat(form.salePrice),
      stock: parseFloat(form.stock), minStock: parseFloat(form.minStock) }
    if (editing) {
      await fetch(`/api/inventory/products/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/inventory/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setShowModal(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/inventory/products/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  )
  const lowStock = products.filter(p => p.stock <= p.minStock && p.status === 'ACTIVE')
  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)

  return (
    <div>
      <Header title="Produits & Stock" subtitle="Gestion du catalogue et des niveaux de stock" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="Total produits" value={products.length} icon={Package} color="blue" />
          <StatsCard title="Valeur stock" value={formatCurrency(totalValue)} subtitle="au prix de revient" icon={TrendingUp} color="green" />
          <StatsCard title="Stock faible" value={lowStock.length} subtitle="en dessous du seuil" icon={AlertTriangle} color={lowStock.length > 0 ? 'red' : 'green'} />
          <StatsCard title="Catégories" value={categories.length} icon={Package} color="purple" />
        </div>

        {lowStock.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-orange-800">Alerte stock faible</p>
              <p className="text-sm text-orange-600 mt-0.5">
                {lowStock.map(p => `${p.name} (${p.stock} ${p.unit})`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9 w-64" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Nouveau produit
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th><th>Produit</th><th>Catégorie</th><th>Prix achat</th>
                  <th>Prix vente</th><th>Stock</th><th>Statut</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-10">Aucun produit trouvé</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-gray-500">{p.code}</td>
                    <td>
                      <p className="font-medium">{p.name}</p>
                      {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                    </td>
                    <td className="text-gray-500">{p.category?.name || '—'}</td>
                    <td>{formatCurrency(p.costPrice)}</td>
                    <td className="font-medium">{formatCurrency(p.salePrice)}</td>
                    <td>
                      <span className={`font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-green-600'}`}>
                        {p.stock} {p.unit}
                      </span>
                      {p.stock <= p.minStock && <AlertTriangle size={12} className="inline ml-1 text-orange-500" />}
                    </td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => openEdit(p)}>
                          <Pencil size={14} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le produit' : 'Nouveau produit'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Code produit *</label>
              <input className="input" required value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="PROD-001" />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom du produit" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                <option value="">Sans catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unité</label>
              <input className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="pcs, kg, L..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prix d'achat (€) *</label>
              <input className="input" type="number" step="0.01" required value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
            </div>
            <div>
              <label className="label">Prix de vente (€) *</label>
              <input className="input" type="number" step="0.01" required value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Stock initial</label>
              <input className="input" type="number" step="0.01" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
            </div>
            <div>
              <label className="label">Stock minimum (alerte)</label>
              <input className="input" type="number" step="0.01" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
