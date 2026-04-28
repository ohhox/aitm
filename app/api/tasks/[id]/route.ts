import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: {
      children: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
      report: { include: { review: true } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!task) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json(task)
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json()

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      acceptanceCriteria: body.acceptanceCriteria
        ? JSON.stringify(body.acceptanceCriteria)
        : undefined,
      notes: body.notes,
      order: body.order,
    },
  })

  return Response.json(task)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  await prisma.task.delete({ where: { id: Number(id) } })
  return Response.json({ ok: true })
}
