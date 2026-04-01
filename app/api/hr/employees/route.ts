import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (status) {
      where.status = status
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('GET /api/hr/employees error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Auto-generate employeeId like EMP-0001
    const count = await prisma.employee.count()
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`

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

    if (!firstName || !lastName || !email || !position || !salary || !hireDate) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        position,
        departmentId: departmentId || null,
        salary: parseFloat(salary),
        hireDate: new Date(hireDate),
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
        status: status || 'ACTIVE',
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/hr/employees error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Un employé avec cet email existe déjà' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
