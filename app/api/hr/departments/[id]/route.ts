import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const dept = await prisma.department.update({ where: { id: params.id }, data: body })
  return NextResponse.json(dept)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.department.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
