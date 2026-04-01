import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}

    if (month) {
      where.month = parseInt(month)
    }

    if (year) {
      where.year = parseInt(year)
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { employee: { lastName: 'asc' } },
      ],
    })

    return NextResponse.json(payslips)
  } catch (error) {
    console.error('GET /api/hr/payroll error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, employeeId, bonuses, deductions, status } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Mois et année sont obligatoires' },
        { status: 400 }
      )
    }

    const parsedMonth = parseInt(month)
    const parsedYear = parseInt(year)

    // If employeeId is provided, generate/update a single payslip
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      })

      if (!employee) {
        return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
      }

      const bonus = parseFloat(bonuses || '0')
      const deduction = parseFloat(deductions || '0')
      const netSalary = employee.salary + bonus - deduction

      const payslip = await prisma.payslip.upsert({
        where: {
          employeeId_month_year: {
            employeeId,
            month: parsedMonth,
            year: parsedYear,
          },
        },
        update: {
          baseSalary: employee.salary,
          bonuses: bonus,
          deductions: deduction,
          netSalary,
          status: status || 'DRAFT',
          paidAt: status === 'PAID' ? new Date() : null,
        },
        create: {
          employeeId,
          month: parsedMonth,
          year: parsedYear,
          baseSalary: employee.salary,
          bonuses: bonus,
          deductions: deduction,
          netSalary,
          status: status || 'DRAFT',
          paidAt: status === 'PAID' ? new Date() : null,
        },
        include: {
          employee: {
            include: { department: true },
          },
        },
      })

      return NextResponse.json(payslip, { status: 201 })
    }

    // Generate payslips for ALL active employees for the given month/year
    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
    })

    const results = await Promise.allSettled(
      activeEmployees.map(async (employee) => {
        const netSalary = employee.salary // bonuses=0, deductions=0 by default

        return prisma.payslip.upsert({
          where: {
            employeeId_month_year: {
              employeeId: employee.id,
              month: parsedMonth,
              year: parsedYear,
            },
          },
          update: {
            baseSalary: employee.salary,
            netSalary,
          },
          create: {
            employeeId: employee.id,
            month: parsedMonth,
            year: parsedYear,
            baseSalary: employee.salary,
            bonuses: 0,
            deductions: 0,
            netSalary,
            status: 'DRAFT',
          },
        })
      })
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json(
      {
        message: `${succeeded} fiche(s) de paie générée(s)${failed > 0 ? `, ${failed} erreur(s)` : ''}`,
        succeeded,
        failed,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/hr/payroll error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, bonuses, deductions } = body

    if (!id) {
      return NextResponse.json({ error: 'id est obligatoire' }, { status: 400 })
    }

    const existing = await prisma.payslip.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Fiche de paie introuvable' }, { status: 404 })
    }

    const bonus = bonuses !== undefined ? parseFloat(bonuses) : existing.bonuses
    const deduction = deductions !== undefined ? parseFloat(deductions) : existing.deductions
    const netSalary = existing.baseSalary + bonus - deduction

    const payslip = await prisma.payslip.update({
      where: { id },
      data: {
        bonuses: bonus,
        deductions: deduction,
        netSalary,
        status: status || existing.status,
        paidAt: status === 'PAID' && !existing.paidAt ? new Date() : existing.paidAt,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    })

    return NextResponse.json(payslip)
  } catch (error) {
    console.error('PATCH /api/hr/payroll error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
