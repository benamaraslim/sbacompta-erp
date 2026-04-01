import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: { include: { product: true } } },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const count = await prisma.order.count()
  const number = `CMD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const order = await prisma.order.create({
    data: {
      number,
      customerId: body.customerId,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      notes: body.notes,
      items: {
        create: body.items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { customer: true, items: { include: { product: true } } },
  })
  return NextResponse.json(order, { status: 201 })
}
