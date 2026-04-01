import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, approvedBy } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Le statut est obligatoire' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = { status }

    if (approvedBy) {
      data.approvedBy = approvedBy
    }

    const leave = await prisma.leave.update({
      where: { id: params.id },
      data,
      include: {
        employee: {
          include: { department: true },
        },
      },
    })

    return NextResponse.json(leave)
  } catch (error: unknown) {
    console.error('PATCH /api/hr/leaves/[id] error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Congé introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.leave.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/hr/leaves/[id] error:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Congé introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
