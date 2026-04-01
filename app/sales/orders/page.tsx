'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingCart, Plus, Truck, CheckCircle, Clock } from 'lucide-react'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [form, setForm] = useState({
    customerId: '', notes: '', deliveryDate: '',
    items: [{ productId: '', quantity: '1', unitPrice: '' }],
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [oRes, cRes, pRes] = await Promise.all([
      fetch('/api/sales/orders'),
      fetch('/api/sales/customers'),
      fetch('/api/inventory/products'),
    ])
    setOrders(await oRes.json())
    setCustomers(await cRes.json())
    setProducts(await pRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addItem = () => setForm({...form, items: [...form.items, { productId: '', quantity: '1', unitPrice: '' }]})
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    if (field === 'productId') {
      const prod = products.find(p => p.id === value)
      if (prod) items[i].unitPrice = String(prod.salePrice)
    }
    setForm({...form, items})
  }
  const removeItem = (i: number) => setForm({...form, items: form.items.filter((_, idx) => idx !== i)})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/sales/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: form.customerId,
        deliveryDate: form.deliveryDate || null,
        notes: form.notes,
        items: form.items.map(i => ({ productId: i.productId, quantity: parseFloat(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
      }),
    })
    setSaving(false); setShowModal(false)
    setForm({ customerId: '', notes: '', deliveryDate: '', items: [{ productId: '', quantity: '1', unitPrice: '' }] })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/sales/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const filtered = filterStatus === 'ALL' ? orders : orders.filter(o => o.status === filterStatus)
  const calcTotal = (items: any[]) => (items || []).reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0)

  const pending = orders.filter(o => o.status === 'PENDING').length
  const inProgress = orders.filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length
  const delivered = orders.filter(o => o.status === 'DELIVERED').length

  const nextStatus: Record<string, string> = {
    PENDING: 'CONFIRMED', CONFIRMED: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED'
  }
  const nextLabel: Record<string, string> = {
    PENDING: 'Confirmer', CONFIRMED: 'En préparation', PROCESSING: 'Expédier', SHIPPED: 'Livré'
  }

  return (
    <div>
      <Header title="Commandes clients" subtitle="Gestion des commandes et livraisons" />
      <div className="p-6">
        <div className="stats-grid">
          <StatsCard title="En attente" value={pending} icon={Clock} color="orange" />
          <StatsCard title="En cours" value={inProgress} icon={Truck} color="blue" />
          <StatsCard title="Livrées" value={delivered} icon={CheckCircle} color="green" />
          <StatsCard title="CA commandes" value={formatCurrency(orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + calcTotal(o.items || []), 0))} icon={ShoppingCart} color="purple" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-wrap">
                {['ALL', ...ORDER_STATUSES.slice(0, 4)].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s === 'ALL' ? 'Toutes' : s === 'PENDING' ? 'En attente' : s === 'CONFIRMED' ? 'Confirmées' : s === 'PROCESSING' ? 'En cours' : s === 'SHIPPED' ? 'Expédiées' : s}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nouvelle commande</button>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>N°</th><th>Client</th><th>Articles</th><th>Total</th><th>Livraison</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">Aucune commande</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td className="font-medium text-blue-600">{o.number}</td>
                    <td>{o.customer?.name}</td>
                    <td className="text-gray-500">{(o.items || []).length} article(s)</td>
                    <td className="font-medium">{formatCurrency(calcTotal(o.items || []))}</td>
                    <td className="text-gray-500">{o.deliveryDate ? formatDate(o.deliveryDate) : '—'}</td>
                    <td><Badge status={o.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        {nextStatus[o.status] && (
                          <button className="text-xs text-blue-600 hover:underline" onClick={() => updateStatus(o.id, nextStatus[o.status])}>
                            {nextLabel[o.status]}
                          </button>
                        )}
                        {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                          <button className="text-xs text-red-400 hover:underline" onClick={() => updateStatus(o.id, 'CANCELLED')}>Annuler</button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle commande" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select className="input" required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                <option value="">Sélectionner un client</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date de livraison prévue</label>
              <input type="date" className="input" value={form.deliveryDate} onChange={e => setForm({...form, deliveryDate: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="label">Articles *</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Produit</th>
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
                        <select className="input" required value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                          <option value="">Choisir...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                        </select>
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
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700">Total :</td>
                    <td className="px-3 py-2 font-bold text-gray-900">
                      {formatCurrency(form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button type="button" className="btn-secondary text-sm mt-2" onClick={addItem}>+ Ajouter un article</button>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Création...' : 'Créer la commande'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
