import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, title, amount, category, date, description } = body

    const existing = await prisma.expense.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Dépense introuvable' }, { status: 404 })
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(status ? { status: status as any } : {}),
        ...(title ? { title } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(category ? { category: category as any } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('PATCH /api/finance/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la dépense' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.expense.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Dépense introuvable' }, { status: 404 })
    }

    await prisma.expense.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/finance/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la dépense' }, { status: 500 })
  }
}
