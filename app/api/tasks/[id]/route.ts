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
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.acceptanceCriteria !== undefined && {
        acceptanceCriteria: body.acceptanceCriteria?.length
          ? JSON.stringify(body.acceptanceCriteria)
          : null,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.parentId !== undefined && { parentId: body.parentId }),
    },
  })

  return Response.json(task)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  await prisma.task.delete({ where: { id: Number(id) } })
  return Response.json({ ok: true })
}
