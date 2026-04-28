import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/ai/tasks/[id]/review'>) {
  const { id } = await ctx.params
  const report = await prisma.report.findUnique({
    where: { taskId: Number(id) },
    include: { review: true },
  })

  if (!report) return Response.json({ status: 'no_report' })
  if (!report.review) return Response.json({ status: 'pending' })

  return Response.json({
    status: report.review.decision,
    decision: report.review.decision,
    comments: report.review.comments,
    reviewedAt: report.review.createdAt,
  })
}
