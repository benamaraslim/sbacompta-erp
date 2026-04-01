import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: { category: true },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { categoryId, ...rest } = body
  const product = await prisma.product.create({
    data: {
      ...rest,
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
    },
    include: { category: true },
  })
  return NextResponse.json(product, { status: 201 })
}
