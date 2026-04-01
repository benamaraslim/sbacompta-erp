import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcInvoiceTotal } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { amount, method, reference, date, notes } = body

    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Le montant et le mode de paiement sont requis' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Impossible d\'ajouter un paiement à une facture annulée' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: params.id,
        amount: Number(amount),
        method: method as any,
        reference: reference || null,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    })

    const { total } = calcInvoiceTotal(invoice.items)
    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + p.amount, 0) + Number(amount)

    let newStatus: string
    if (totalPaid >= total) {
      newStatus = 'PAID'
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL'
    } else {
      newStatus = invoice.status
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: newStatus as any },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json({ payment, invoice: updatedInvoice }, { status: 201 })
  } catch (error) {
    console.error('POST /api/finance/invoices/[id]/payments error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du paiement' }, { status: 500 })
  }
}
