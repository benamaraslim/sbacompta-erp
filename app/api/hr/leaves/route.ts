import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const employeeId = searchParams.get('employeeId') || ''

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leaves)
  } catch (error) {
    console.error('GET /api/hr/leaves error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, type, startDate, endDate, days, reason } = body

    if (!employeeId || !type || !startDate || !endDate || !days) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseInt(days),
        reason: reason || null,
        status: 'PENDING',
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    })

    return NextResponse.json(leave, { status: 201 })
  } catch (error) {
    console.error('POST /api/hr/leaves error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
