import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { orderDate: 'desc' },
    include: { supplier: true, items: { include: { product: true } } },
  })
  return NextResponse.json(purchases)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const count = await prisma.purchase.count()
  const number = `BC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const purchase = await prisma.purchase.create({
    data: {
      number,
      supplierId: body.supplierId,
      notes: body.notes,
      items: {
        create: body.items.map((item: { productId: string; quantity: number; unitCost: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
    include: { supplier: true, items: { include: { product: true } } },
  })
  return NextResponse.json(purchase, { status: 201 })
}
