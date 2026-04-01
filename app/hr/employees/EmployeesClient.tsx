'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Eye } from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  position: string
  departmentId: string | null
  department: Department | null
  salary: number
  hireDate: string | Date
  status: string
}

interface Props {
  employees: Employee[]
  departments: Department[]
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'ON_LEAVE', label: 'En congé' },
  { value: 'TERMINATED', label: 'Terminé' },
]

const LEAVE_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Congé annuel' },
  { value: 'SICK', label: 'Maladie' },
  { value: 'MATERNITY', label: 'Maternité' },
  { value: 'PATERNITY', label: 'Paternité' },
  { value: 'UNPAID', label: 'Sans solde' },
  { value: 'OTHER', label: 'Autre' },
]

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function AvatarInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
  ]
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${colors[idx]}`}>
      {getInitials(firstName, lastName)}
    </div>
  )
}

export default function EmployeesClient({ employees, departments }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    departmentId: '',
    salary: '',
    hireDate: '',
    birthDate: '',
    address: '',
    status: 'ACTIVE',
  })

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !search ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        emp.position.toLowerCase().includes(search.toLowerCase())

      const matchDept = !filterDept || emp.departmentId === filterDept
      const matchStatus = !filterStatus || emp.status === filterStatus

      return matchSearch && matchDept && matchStatus
    })
  }, [employees, search, filterDept, filterStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salary: parseFloat(form.salary),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la création')
        return
      }

      setShowModal(false)
      setForm({
        firstName: '', lastName: '', email: '', phone: '',
        position: '', departmentId: '', salary: '', hireDate: '',
        birthDate: '', address: '', status: 'ACTIVE',
      })
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Rechercher par nom, email, matricule, poste..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">Tous les départements</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            className="btn-primary whitespace-nowrap"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Nouvel employé
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Poste</th>
                <th>Département</th>
                <th>Salaire</th>
                <th>Date d'embauche</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-10">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <AvatarInitials firstName={emp.firstName} lastName={emp.lastName} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{emp.employeeId} · {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-700">{emp.position}</td>
                    <td className="text-gray-500">{emp.department?.name ?? '—'}</td>
                    <td className="font-medium text-gray-900">{formatCurrency(emp.salary)}</td>
                    <td className="text-gray-500">{formatDate(emp.hireDate)}</td>
                    <td><Badge status={emp.status} /></td>
                    <td>
                      <Link
                        href={`/hr/employees/${emp.id}`}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                      >
                        <Eye size={13} />
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-400">
          {filtered.length} employé{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* New Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError('') }}
        title="Nouvel employé"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom *</label>
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Poste *</label>
              <input
                className="input"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Département</label>
              <select
                className="input"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">— Aucun —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Salaire brut (€) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Statut</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
                <option value="ON_LEAVE">En congé</option>
                <option value="TERMINATED">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date d'embauche *</label>
              <input
                type="date"
                className="input"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Date de naissance</label>
              <input
                type="date"
                className="input"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Adresse</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Adresse complète"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setShowModal(false); setError('') }}
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Création...' : 'Créer l\'employé'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
