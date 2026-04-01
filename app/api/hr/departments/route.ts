import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: {
          where: { status: 'ACTIVE' },
          select: { id: true, firstName: true, lastName: true, position: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error('GET /api/hr/departments error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, managerId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom du département est obligatoire' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        managerId: managerId || null,
      },
      include: {
        employees: {
          where: { status: 'ACTIVE' },
          select: { id: true, firstName: true, lastName: true, position: true },
        },
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/hr/departments error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Un département avec ce nom existe déjà' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, managerId } = body

    if (!id) {
      return NextResponse.json({ error: 'id est obligatoire' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description || null
    if (managerId !== undefined) data.managerId = managerId || null

    const department = await prisma.department.update({
      where: { id },
      data,
      include: {
        employees: {
          where: { status: 'ACTIVE' },
          select: { id: true, firstName: true, lastName: true, position: true },
        },
      },
    })

    return NextResponse.json(department)
  } catch (error: unknown) {
    console.error('PATCH /api/hr/departments error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Département introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
