import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/tasks/[id]/review'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const { decision, comments } = body

  if (!decision || !['approved', 'revision'].includes(decision)) {
    return Response.json({ error: 'decision must be approved or revision' }, { status: 400 })
  }

  const report = await prisma.report.findUnique({ where: { taskId: Number(id) } })
  if (!report) return Response.json({ error: 'report not found' }, { status: 404 })

  const review = await prisma.review.upsert({
    where: { reportId: report.id },
    create: { reportId: report.id, decision, comments: comments || null },
    update: { decision, comments: comments || null },
  })

  // Update report status and task status
  await prisma.report.update({
    where: { id: report.id },
    data: { status: decision },
  })

  await prisma.task.update({
    where: { id: Number(id) },
    data: { status: decision === 'approved' ? 'done' : 'in_progress' },
  })

  // Log the review
  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    select: { projectId: true, title: true },
  })

  if (task) {
    await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        taskId: Number(id),
        message:
          decision === 'approved'
            ? `Approved — Task "${task.title}" by you`
            : `Revision requested — Task "${task.title}"${comments ? `: ${comments.slice(0, 80)}` : ''}`,
        level: decision === 'approved' ? 'DONE' : 'WARN',
      },
    })
  }

  return Response.json(review)
}
