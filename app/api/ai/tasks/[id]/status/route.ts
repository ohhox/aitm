import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/ai/tasks/[id]/status'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const { status, notes } = body

  const validStatuses = ['todo', 'in_progress', 'blocked', 'pending_review', 'done']
  if (!validStatuses.includes(status)) {
    return Response.json({ error: 'invalid status' }, { status: 400 })
  }

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: { status, notes: notes ?? undefined },
  })

  await prisma.activityLog.create({
    data: {
      projectId: task.projectId,
      taskId: task.id,
      message: `Task "${task.title}" → ${status}`,
      level: status === 'done' ? 'DONE' : status === 'blocked' ? 'WARN' : 'INFO',
    },
  })

  return Response.json(task)
}
