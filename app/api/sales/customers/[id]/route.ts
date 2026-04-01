import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      invoices: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      orders: { orderBy: { createdAt: 'desc' }, take: 10 },
      quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const customer = await prisma.customer.update({ where: { id: params.id }, data: body })
  return NextResponse.json(customer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.customer.update({ where: { id: params.id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ success: true })
}
