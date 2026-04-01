import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('GET /api/finance/invoices error:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des factures' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, dueDate, notes, items } = body

    if (!customerId || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Client, date d\'échéance et au moins un article sont requis' },
        { status: 400 }
      )
    }

    const count = await prisma.invoice.count()
    const year = new Date().getFullYear()
    const number = `FAC-${year}-${String(count + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        number,
        customerId,
        dueDate: new Date(dueDate),
        notes: notes || null,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number; taxRate: number }) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate ?? 20),
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('POST /api/finance/invoices error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la facture' }, { status: 500 })
  }
}
