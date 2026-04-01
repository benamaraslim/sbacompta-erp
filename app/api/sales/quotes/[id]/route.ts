import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const quote = await prisma.quote.update({
    where: { id: params.id },
    data: body,
    include: { customer: true, items: true },
  })
  return NextResponse.json(quote)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.quote.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
