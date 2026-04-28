import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/ai/projects/[id]/context'>) {
  const { id } = await ctx.params
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      tasks: {
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          children: {
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            include: { report: { include: { review: true } } },
          },
          report: { include: { review: true } },
        },
      },
    },
  })

  if (!project) return Response.json({ error: 'project not found' }, { status: 404 })

  // Find current task (in_progress or first todo)
  const allTasks = project.tasks.flatMap((t) => [t, ...t.children])
  const currentTask =
    allTasks.find((t) => t.status === 'in_progress') ||
    allTasks.find((t) => t.status === 'todo')

  // Find pending review
  const pendingReview = allTasks.find((t) => t.status === 'pending_review')

  // Find next task after current
  const currentIdx = currentTask ? allTasks.indexOf(currentTask) : -1
  const nextTask = currentIdx >= 0 ? allTasks.slice(currentIdx + 1).find((t) => t.status === 'todo') : null

  const constraints = project.constraints ? JSON.parse(project.constraints) : []

  return Response.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      goals: project.goals,
      techStack: project.techStack,
      context: project.context,
      status: project.status,
      constraints,
    },
    currentTask: currentTask
      ? {
          id: currentTask.id,
          title: currentTask.title,
          description: currentTask.description,
          status: currentTask.status,
          acceptanceCriteria: currentTask.acceptanceCriteria
            ? JSON.parse(currentTask.acceptanceCriteria)
            : [],
          notes: currentTask.notes,
        }
      : null,
    pendingReview: pendingReview
      ? {
          taskId: pendingReview.id,
          title: pendingReview.title,
          review: pendingReview.report?.review || null,
        }
      : null,
    nextTask: nextTask ? { id: nextTask.id, title: nextTask.title } : null,
    taskTree: project.tasks,
    instructions: getInstructions(project.status),
  })
}

function getInstructions(status: string) {
  if (status === 'planning') {
    return 'โปรเจดอยู่ในขั้นตอน planning — วิเคราะห์โปรเจดแล้วสร้าง task tree ผ่าน POST /api/ai/projects/:id/plan'
  }
  return 'ก่อนทำงาน: อ่าน currentTask, อัพเดต activity ทุก step ผ่าน POST /api/ai/activity, เสร็จแล้วส่ง report ผ่าน POST /api/ai/tasks/:id/report แล้วหยุดรอ review'
}
