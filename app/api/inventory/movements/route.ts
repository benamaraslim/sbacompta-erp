import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const movements = await prisma.stockMovement.findMany({
    orderBy: { date: 'desc' },
    include: { product: true },
  })
  return NextResponse.json(movements)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { productId, type, quantity, reason } = body

  const movement = await prisma.$transaction(async (tx) => {
    const mov = await tx.stockMovement.create({
      data: { productId, type, quantity, reason },
      include: { product: true },
    })

    // Update product stock
    const delta = (type === 'IN' || type === 'RETURN') ? quantity : (type === 'OUT' ? -quantity : 0)
    if (delta !== 0) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      })
    } else if (type === 'ADJUSTMENT') {
      await tx.product.update({
        where: { id: productId },
        data: { stock: quantity },
      })
    }

    return mov
  })

  return NextResponse.json(movement, { status: 201 })
}
