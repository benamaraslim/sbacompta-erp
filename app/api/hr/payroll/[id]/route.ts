import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const data: Record<string, unknown> = { status: body.status }
  if (body.status === 'PAID') data.paidAt = new Date()
  const payslip = await prisma.payslip.update({ where: { id: params.id }, data })
  return NextResponse.json(payslip)
}
