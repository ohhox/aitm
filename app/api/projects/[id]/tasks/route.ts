import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/projects/[id]/tasks'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const { title, description, parentId, acceptanceCriteria, notes, order } = body

  if (!title) return Response.json({ error: 'title required' }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      projectId: Number(id),
      parentId: parentId ? Number(parentId) : null,
      title,
      description: description || null,
      acceptanceCriteria: acceptanceCriteria ? JSON.stringify(acceptanceCriteria) : null,
      notes: notes || null,
      order: order ?? 0,
      status: 'todo',
    },
  })

  return Response.json(task, { status: 201 })
}
