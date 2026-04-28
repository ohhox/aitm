import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/ai/tasks/[id]/report'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const { summary, filesChanged, concerns } = body

  if (!summary) return Response.json({ error: 'summary required' }, { status: 400 })

  const taskId = Number(id)

  const report = await prisma.report.upsert({
    where: { taskId },
    create: {
      taskId,
      summary,
      filesChanged: filesChanged ? JSON.stringify(filesChanged) : null,
      concerns: concerns || null,
      status: 'pending',
    },
    update: {
      summary,
      filesChanged: filesChanged ? JSON.stringify(filesChanged) : null,
      concerns: concerns || null,
      status: 'pending',
    },
  })

  // Set task to pending_review
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: 'pending_review' },
  })

  await prisma.activityLog.create({
    data: {
      projectId: task.projectId,
      taskId,
      message: `Task "${task.title}" เสร็จแล้ว — รอ review จากคุณ`,
      level: 'WAIT',
    },
  })

  return Response.json(report, { status: 201 })
}
