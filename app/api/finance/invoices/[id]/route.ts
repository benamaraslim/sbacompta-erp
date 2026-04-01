import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('GET /api/finance/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération de la facture' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, notes, dueDate } = body

    const existing = await prisma.invoice.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('PATCH /api/finance/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la facture' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    await prisma.invoice.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/finance/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la facture' }, { status: 500 })
  }
}
