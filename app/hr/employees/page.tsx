import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, UserCheck, UserX, CalendarPlus } from 'lucide-react'
import Badge from '@/components/Badge'
import EmployeesClient from './EmployeesClient'

async function getEmployeesData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [employees, departments, stats] = await Promise.all([
    prisma.employee.findMany({
      include: { department: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.count({
        where: { hireDate: { gte: startOfMonth } },
      }),
    ]),
  ])

  return {
    employees,
    departments,
    totalCount: stats[0],
    activeCount: stats[1],
    onLeaveCount: stats[2],
    newThisMonth: stats[3],
  }
}

export default async function EmployeesPage() {
  const data = await getEmployeesData()

  return (
    <div>
      <Header
        title="Employés"
        subtitle="Gestion des ressources humaines"
      />

      <div className="p-6">
        {/* Stats */}
        <div className="stats-grid">
          <StatsCard
            title="Total employés"
            value={data.totalCount}
            subtitle="Tous statuts confondus"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Employés actifs"
            value={data.activeCount}
            icon={UserCheck}
            color="green"
          />
          <StatsCard
            title="En congé"
            value={data.onLeaveCount}
            icon={UserX}
            color="orange"
          />
          <StatsCard
            title="Nouveaux ce mois"
            value={data.newThisMonth}
            subtitle="Recrutements du mois"
            icon={CalendarPlus}
            color="purple"
          />
        </div>

        <EmployeesClient
          employees={data.employees}
          departments={data.departments}
        />
      </div>
    </div>
  )
}
