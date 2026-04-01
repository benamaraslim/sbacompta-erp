'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Badge from '@/components/Badge'
import StatsCard from '@/components/StatsCard'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ClipboardList, Plus, Truck, CheckCircle, Clock } from 'lucide-react'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [{ productId: '', quantity: '1', unitCost: '' }] })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [purRes, supRes, prodRes] = await Promise.all([
      fetch('/api/inventory/purchases'),
      fetch('/api/inventory/suppliers'),
      fetch('/api/inventory/products'),
    ])
    setPurchases(await purRes.json())
    setSuppliers(await supRes.json())
    setProducts(await prodRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addItem = () => setForm({...form, items: [...form.items, { productId: '', quantity: '1', unitCost: '' }]})
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    if (field === 'productId') {
      const prod = products.find(p => p.id === value)
      if (prod) items[i].unitCost = String(prod.costPrice)
    }
    setForm({...form, items})
  }
  const removeItem = (i: number) => setForm({...form, items: form.items.filter((_, idx) => idx !== i)})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/inventory/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: form.supplierId, notes: form.notes,
        items: form.items.map(i => ({ productId: i.productId, quantity: parseFloat(i.quantity), unitCost: parseFloat(i.unitCost) })),
      }),
    })
    setSaving(false); setShowModal(false)
    setForm({ supplierId: '', notes: '', items: [{ productId: '', quantity: '1', unitCost: '' }] })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/inventory/purchases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const pending = purchases.filter(p => p.status === 'ORDERED' || p.status === 'PARTIAL').length
  const totalOrdered = purchases.filter(p => p.status !== 'CANCELLED').reduce((s, p) =>
    s + (p.items || []).reduce((si: number, i: any) => si + i.quantity * i.unitCost, 0), 0)

  return (
    <div>
      <Header title="Bons de commande fournisseur" subtitle="Gestion des achats et réceptions" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="Total achats" value={purchases.length} icon={ClipboardList} color="blue" />
          <StatsCard title="En cours" value={pending} subtitle="commandes en attente" icon={Clock} color="orange" />
          <StatsCard title="Valeur totale" value={formatCurrency(totalOrdered)} icon={Truck} color="green" />
          <StatsCard title="Fournisseurs" value={suppliers.length} icon={Truck} color="purple" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Commandes fournisseurs</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nouvelle commande</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>N°</th><th>Fournisseur</th><th>Articles</th><th>Total</th><th>Date</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Aucune commande</td></tr>
                ) : purchases.map(p => {
                  const total = (p.items || []).reduce((s: number, i: any) => s + i.quantity * i.unitCost, 0)
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-blue-600">{p.number}</td>
                      <td>{p.supplier?.name}</td>
                      <td className="text-gray-500">{(p.items || []).length} article(s)</td>
                      <td className="font-medium">{formatCurrency(total)}</td>
                      <td className="text-gray-500">{formatDate(p.orderDate)}</td>
                      <td><Badge status={p.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          {p.status === 'DRAFT' && (
                            <button className="text-xs text-blue-600 hover:underline" onClick={() => updateStatus(p.id, 'ORDERED')}>Commander</button>
                          )}
                          {(p.status === 'ORDERED' || p.status === 'PARTIAL') && (
                            <button className="text-xs text-green-600 hover:underline flex items-center gap-1" onClick={() => updateStatus(p.id, 'RECEIVED')}>
                              <CheckCircle size={12} /> Réceptionner
                            </button>
                          )}
                          {p.status !== 'RECEIVED' && p.status !== 'CANCELLED' && (
                            <button className="text-xs text-red-400 hover:underline" onClick={() => updateStatus(p.id, 'CANCELLED')}>Annuler</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle commande fournisseur" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Fournisseur *</label>
            <select className="input" required value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Articles *</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <select className="input" required value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">Produit...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input className="input" type="number" step="0.01" min="0.01" placeholder="Quantité" required value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <input className="input" type="number" step="0.01" min="0" placeholder="Prix unitaire €" required value={item.unitCost} onChange={e => updateItem(i, 'unitCost', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    {form.items.length > 1 && (
                      <button type="button" className="btn-danger py-2 px-2" onClick={() => removeItem(i)}>×</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="btn-secondary text-sm" onClick={addItem}>+ Ajouter une ligne</button>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Créer la commande'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
