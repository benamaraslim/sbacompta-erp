import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const category = await prisma.category.create({ data: body })
  return NextResponse.json(category, { status: 201 })
}
