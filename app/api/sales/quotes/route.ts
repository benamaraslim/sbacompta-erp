import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: true },
  })
  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const count = await prisma.quote.count()
  const number = `DEV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const quote = await prisma.quote.create({
    data: {
      number,
      customerId: body.customerId,
      validUntil: new Date(body.validUntil),
      notes: body.notes,
      items: {
        create: body.items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { customer: true, items: true },
  })
  return NextResponse.json(quote, { status: 201 })
}
