import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]/report'>) {
  const { id } = await ctx.params
  const report = await prisma.report.findUnique({
    where: { taskId: Number(id) },
    include: { review: true, task: { select: { id: true, title: true, projectId: true } } },
  })
  if (!report) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json(report)
}
