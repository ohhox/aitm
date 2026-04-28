import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/projects/[id]'>) {
  const { id } = await ctx.params
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      tasks: {
        where: { parentId: null },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          children: {
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            include: { report: { select: { id: true, status: true } } },
          },
          report: { select: { id: true, status: true } },
        },
      },
    },
  })

  if (!project) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json(project)
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/projects/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json()

  const project = await prisma.project.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      description: body.description,
      goals: body.goals,
      techStack: body.techStack,
      constraints: body.constraints ? JSON.stringify(body.constraints) : undefined,
      context: body.context,
      status: body.status,
    },
  })

  return Response.json(project)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/projects/[id]'>) {
  const { id } = await ctx.params
  await prisma.project.delete({ where: { id: Number(id) } })
  return Response.json({ ok: true })
}
