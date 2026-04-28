import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      tasks: { where: { parentId: null } },
      _count: { select: { tasks: true, activityLogs: true } },
    },
  })

  const result = projects.map((p) => {
    const doneTasks = p.tasks.filter((t) => t.status === 'done').length
    const pendingReviews = p.tasks.filter((t) => t.status === 'pending_review').length
    return {
      ...p,
      taskCount: p._count.tasks,
      doneCount: doneTasks,
      pendingReviews,
      tasks: undefined,
      _count: undefined,
    }
  })

  return Response.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, goals, techStack, constraints, context } = body

  if (!name) return Response.json({ error: 'name required' }, { status: 400 })

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      goals: goals || null,
      techStack: techStack || null,
      constraints: constraints ? JSON.stringify(constraints) : null,
      context: context || null,
      status: 'planning',
    },
  })

  return Response.json(project, { status: 201 })
}
