import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/projects/[id]/activity'>) {
  const { id } = await ctx.params
  const logs = await prisma.activityLog.findMany({
    where: { projectId: Number(id) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { task: { select: { id: true, title: true } } },
  })
  return Response.json(logs)
}
