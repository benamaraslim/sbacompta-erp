import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const customer = await prisma.customer.create({ data: body })
  return NextResponse.json(customer, { status: 201 })
}
