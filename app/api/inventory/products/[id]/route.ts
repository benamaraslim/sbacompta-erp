import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, movements: { orderBy: { date: 'desc' }, take: 20 } },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { categoryId, ...rest } = body
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(categoryId !== undefined ? (categoryId ? { category: { connect: { id: categoryId } } } : { category: { disconnect: true } }) : {}),
    },
    include: { category: true },
  })
  return NextResponse.json(product)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.product.update({ where: { id: params.id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ success: true })
}
