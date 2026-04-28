import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { projectId, taskId, message, level, step, totalSteps } = body

  if (!projectId || !message) {
    return Response.json({ error: 'projectId and message required' }, { status: 400 })
  }

  const log = await prisma.activityLog.create({
    data: {
      projectId: Number(projectId),
      taskId: taskId ? Number(taskId) : null,
      message,
      level: level || 'INFO',
      step: step ?? null,
      totalSteps: totalSteps ?? null,
    },
  })

  return Response.json(log, { status: 201 })
}
