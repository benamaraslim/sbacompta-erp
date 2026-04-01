import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const expenses = await prisma.expense.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status: status as any } : {}),
        ...(category && category !== 'ALL' ? { category: category as any } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('GET /api/finance/expenses error:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des dépenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, amount, category, date, description, employeeId } = body

    if (!title || !amount || !category || !date) {
      return NextResponse.json(
        { error: 'Titre, montant, catégorie et date sont requis' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: Number(amount),
        category: category as any,
        date: new Date(date),
        description: description || null,
        employeeId: employeeId || null,
        status: 'PENDING',
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('POST /api/finance/expenses error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la dépense' }, { status: 500 })
  }
}
