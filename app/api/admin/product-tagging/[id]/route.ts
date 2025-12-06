import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IngredientType, BudgetLevel } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { aiTags, isIngredient, ingredientType, budgetLevel } = body

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const updateData: {
      aiTags?: string[]
      isIngredient?: boolean
      ingredientType?: IngredientType | null
      budgetLevel?: BudgetLevel | null
    } = {}

    if (aiTags !== undefined) {
      updateData.aiTags = aiTags
    }
    if (isIngredient !== undefined) {
      updateData.isIngredient = isIngredient
    }
    if (ingredientType !== undefined) {
      updateData.ingredientType = ingredientType ? (ingredientType as IngredientType) : null
    }
    if (budgetLevel !== undefined) {
      updateData.budgetLevel = budgetLevel ? (budgetLevel as BudgetLevel) : null
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        aiTags: true,
        isIngredient: true,
        ingredientType: true,
        budgetLevel: true,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product tags:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}
