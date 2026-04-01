import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  const purchase = await prisma.$transaction(async (tx) => {
    const updated = await tx.purchase.update({
      where: { id: params.id },
      data: { status: body.status, ...(body.status === 'RECEIVED' ? { receiveDate: new Date() } : {}) },
      include: { items: { include: { product: true } } },
    })

    // On reception, create stock movements
    if (body.status === 'RECEIVED') {
      for (const item of updated.items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            unitCost: item.unitCost,
            reference: updated.number,
            reason: `Réception commande ${updated.number}`,
          },
        })
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }
    return updated
  })

  return NextResponse.json(purchase)
}
