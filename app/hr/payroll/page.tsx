'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Badge from '@/components/Badge'
import { formatCurrency } from '@/lib/utils'
import { Wallet, Play, CheckCircle } from 'lucide-react'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function PayrollPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/hr/payroll?month=${month}&year=${year}`)
    setPayslips(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [month, year])

  const generate = async () => {
    setGenerating(true)
    await fetch('/api/hr/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    })
    setGenerating(false)
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/hr/payroll/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0)
  const totalBrut = payslips.reduce((s, p) => s + p.baseSalary + p.bonuses, 0)
  const validated = payslips.filter(p => p.status === 'VALIDATED' || p.status === 'PAID').length

  return (
    <div>
      <Header title="Paie & Bulletins" subtitle="Gestion de la paie mensuelle" />
      <div className="p-6">
        {/* Controls */}
        <div className="card p-4 flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Mois :</label>
            <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Année :</label>
            <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn-primary ml-auto" onClick={generate} disabled={generating}>
            <Play size={16} /> {generating ? 'Génération...' : 'Générer la paie'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-sm text-gray-500">Masse salariale brute</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBrut)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500">Total net à payer</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalNet)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500">Bulletins validés</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{validated} / {payslips.length}</p>
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Bulletins de paie — {MONTHS[month-1]} {year}</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Salaire de base</th>
                  <th>Primes</th>
                  <th>Retenues</th>
                  <th>Net à payer</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : payslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      <p className="text-gray-400 mb-2">Aucun bulletin pour cette période</p>
                      <button className="btn-primary mx-auto" onClick={generate}>
                        <Play size={16} /> Générer maintenant
                      </button>
                    </td>
                  </tr>
                ) : payslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td className="font-medium">{payslip.employee?.firstName} {payslip.employee?.lastName}</td>
                    <td className="text-gray-500">{payslip.employee?.position}</td>
                    <td>{formatCurrency(payslip.baseSalary)}</td>
                    <td className="text-green-600">+{formatCurrency(payslip.bonuses)}</td>
                    <td className="text-red-600">-{formatCurrency(payslip.deductions)}</td>
                    <td className="font-bold">{formatCurrency(payslip.netSalary)}</td>
                    <td><Badge status={payslip.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        {payslip.status === 'DRAFT' && (
                          <button className="text-xs text-blue-600 hover:underline" onClick={() => updateStatus(payslip.id, 'VALIDATED')}>
                            Valider
                          </button>
                        )}
                        {payslip.status === 'VALIDATED' && (
                          <button className="text-xs text-green-600 hover:underline flex items-center gap-1" onClick={() => updateStatus(payslip.id, 'PAID')}>
                            <CheckCircle size={12} /> Marquer payé
                          </button>
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
    </div>
  )
}
