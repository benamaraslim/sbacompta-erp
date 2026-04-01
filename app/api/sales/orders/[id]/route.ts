import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { customer: true, items: { include: { product: true } } },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const order = await prisma.order.update({
    where: { id: params.id },
    data: body,
    include: { customer: true, items: { include: { product: true } } },
  })
  return NextResponse.json(order)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.order.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ success: true })
}
