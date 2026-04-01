import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supplier = await prisma.supplier.update({ where: { id: params.id }, data: body })
  return NextResponse.json(supplier)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.supplier.update({ where: { id: params.id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ success: true })
}
