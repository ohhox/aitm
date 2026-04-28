import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

interface TaskInput {
  title: string
  description?: string
  acceptanceCriteria?: string[]
  notes?: string
  children?: TaskInput[]
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/ai/projects/[id]/plan'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const { tasks, notes } = body as { tasks: TaskInput[]; notes?: string }

  if (!tasks || !Array.isArray(tasks)) {
    return Response.json({ error: 'tasks array required' }, { status: 400 })
  }

  const projectId = Number(id)

  // Delete existing tasks
  await prisma.task.deleteMany({ where: { projectId } })

  // Create tasks
  let order = 0
  for (const taskData of tasks) {
    const parent = await prisma.task.create({
      data: {
        projectId,
        title: taskData.title,
        description: taskData.description || null,
        acceptanceCriteria: taskData.acceptanceCriteria
          ? JSON.stringify(taskData.acceptanceCriteria)
          : null,
        notes: taskData.notes || null,
        order: order++,
        status: 'todo',
      },
    })

    if (taskData.children) {
      let subOrder = 0
      for (const child of taskData.children) {
        await prisma.task.create({
          data: {
            projectId,
            parentId: parent.id,
            title: child.title,
            description: child.description || null,
            acceptanceCriteria: child.acceptanceCriteria
              ? JSON.stringify(child.acceptanceCriteria)
              : null,
            notes: child.notes || null,
            order: subOrder++,
            status: 'todo',
          },
        })
      }
    }
  }

  // Log
  await prisma.activityLog.create({
    data: {
      projectId,
      message: `AI สร้าง task plan แล้ว — ${tasks.length} phases${notes ? ` (${notes.slice(0, 100)})` : ''}`,
      level: 'INFO',
    },
  })

  return Response.json({ ok: true, taskCount: tasks.length })
}
