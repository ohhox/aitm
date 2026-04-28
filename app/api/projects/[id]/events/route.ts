import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/projects/[id]/events'>) {
  const { id } = await ctx.params
  const projectId = Number(id)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      }

      send({ type: 'connected', projectId })

      let lastId = 0
      const poll = setInterval(async () => {
        try {
          const logs = await prisma.activityLog.findMany({
            where: { projectId, id: { gt: lastId } },
            orderBy: { id: 'asc' },
            take: 10,
            include: { task: { select: { id: true, title: true } } },
          })
          if (logs.length > 0) {
            lastId = logs[logs.length - 1].id
            logs.forEach((log) => send({ type: 'activity', log }))
          }

          // Check for pending reviews
          const pendingTask = await prisma.task.findFirst({
            where: { projectId, status: 'pending_review' },
            include: { report: true },
          })
          if (pendingTask) {
            send({ type: 'pending_review', task: pendingTask })
          }
        } catch {
          clearInterval(poll)
          controller.close()
        }
      }, 2000)

      req.signal.addEventListener('abort', () => {
        clearInterval(poll)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
