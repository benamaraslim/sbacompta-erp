import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 31,
        },
        leaves: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payslips: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('GET /api/hr/employees/[id] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      departmentId,
      salary,
      hireDate,
      birthDate,
      address,
      status,
    } = body

    const data: Record<string, unknown> = {}

    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone || null
    if (position !== undefined) data.position = position
    if (departmentId !== undefined) data.departmentId = departmentId || null
    if (salary !== undefined) data.salary = parseFloat(salary)
    if (hireDate !== undefined) data.hireDate = new Date(hireDate)
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
    if (address !== undefined) data.address = address || null
    if (status !== undefined) data.status = status

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data,
      include: {
        department: true,
      },
    })

    return NextResponse.json(employee)
  } catch (error: unknown) {
    console.error('PATCH /api/hr/employees/[id] error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employee.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/hr/employees/[id] error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
