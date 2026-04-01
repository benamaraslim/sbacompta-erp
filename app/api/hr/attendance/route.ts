import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}

    if (dateParam) {
      const date = new Date(dateParam)
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = { gte: date, lt: nextDay }
    } else if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 1)
      where.date = { gte: startDate, lt: endDate }
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: [{ date: 'desc' }, { employee: { lastName: 'asc' } }],
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('GET /api/hr/attendance error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, date, status, checkIn, checkOut, notes } = body

    if (!employeeId || !date || !status) {
      return NextResponse.json(
        { error: 'employeeId, date et status sont obligatoires' },
        { status: 400 }
      )
    }

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: parsedDate,
        },
      },
      update: {
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        notes: notes || null,
      },
      create: {
        employeeId,
        date: parsedDate,
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        notes: notes || null,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('POST /api/hr/attendance error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
