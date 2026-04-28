import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Approve plan → status = active
export async function POST(req: NextRequest, ctx: RouteContext<'/api/projects/[id]/plan'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const { action } = body // 'approve'

  if (action === 'approve') {
    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: { status: 'active' },
    })
    await prisma.activityLog.create({
      data: {
        projectId: Number(id),
        message: 'Plan approved — AI เริ่มทำงานแล้ว',
        level: 'DONE',
      },
    })
    return Response.json(project)
  }

  return Response.json({ error: 'invalid action' }, { status: 400 })
}
