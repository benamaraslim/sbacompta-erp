'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Badge from '@/components/Badge'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

const STATUSES = [
  { value: 'PRESENT', label: 'Présent', color: 'bg-green-100 text-green-700' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-700' },
  { value: 'LATE', label: 'En retard', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HALF_DAY', label: 'Demi-journée', color: 'bg-blue-100 text-blue-700' },
  { value: 'HOLIDAY', label: 'Férié/Congé', color: 'bg-gray-100 text-gray-700' },
]

export default function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [empRes, attRes] = await Promise.all([
      fetch('/api/hr/employees?status=ACTIVE'),
      fetch(`/api/hr/attendance?date=${date}`),
    ])
    const emps = await empRes.json()
    const atts = await attRes.json()
    setEmployees(emps)
    const attMap: Record<string, any> = {}
    atts.forEach((a: any) => { attMap[a.employeeId] = a })
    setAttendance(attMap)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [date])

  const markAttendance = async (employeeId: string, status: string) => {
    setSaving(employeeId)
    await fetch('/api/hr/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, date, status }),
    })
    setSaving(null)
    loadData()
  }

  const present = Object.values(attendance).filter(a => a.status === 'PRESENT').length
  const absent = Object.values(attendance).filter(a => a.status === 'ABSENT').length
  const late = Object.values(attendance).filter(a => a.status === 'LATE').length

  return (
    <div>
      <Header title="Présences" subtitle="Pointage quotidien des employés" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl"><CheckCircle size={20} className="text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Présents</p><p className="text-2xl font-bold text-gray-900">{present}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl"><XCircle size={20} className="text-red-600" /></div>
            <div><p className="text-sm text-gray-500">Absents</p><p className="text-2xl font-bold text-gray-900">{absent}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-xl"><Clock size={20} className="text-yellow-600" /></div>
            <div><p className="text-sm text-gray-500">En retard</p><p className="text-2xl font-bold text-gray-900">{late}</p></div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Pointage du jour
            </h2>
            <input
              type="date"
              className="input w-auto"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Département</th>
                  <th>Statut actuel</th>
                  <th>Marquer comme</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">Chargement...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">Aucun employé actif</td></tr>
                ) : employees.map((emp) => {
                  const att = attendance[emp.id]
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center justify-center font-bold">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-gray-400">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-500">{emp.position}</td>
                      <td className="text-gray-500">{emp.department?.name || '—'}</td>
                      <td>
                        {att ? <Badge status={att.status} /> : <span className="text-xs text-gray-400">Non pointé</span>}
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {STATUSES.map(s => (
                            <button
                              key={s.value}
                              onClick={() => markAttendance(emp.id, s.value)}
                              disabled={saving === emp.id || att?.status === s.value}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                att?.status === s.value
                                  ? s.color + ' border-transparent font-semibold'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
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
    </div>
  )
}
