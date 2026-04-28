import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id: Number(id) } })
  const pending = await prisma.task.findMany({
    where: { projectId: Number(id), status: 'pending_review' },
    include: { report: { include: { review: true } } },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <Link href="/" className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">Dashboard</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <Link href={`/projects/${id}`} className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">{project?.name}</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold">Reviews</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
          <div className="bg-[#F7F8FA] px-3.5 py-2 border-b border-[#E2E6EC] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Pending Reviews ({pending.length})
          </div>
          {pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#9CA3AF]">ไม่มีรายการรอ review</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E2E6EC]">
                  {['Task', 'Submitted', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] bg-[#F7F8FA]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((task) => (
                  <tr key={task.id} className="border-b border-[#E2E6EC] hover:bg-blue-50">
                    <td className="px-4 py-3 font-semibold text-[13px]">{task.title}</td>
                    <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">
                      {task.report ? new Date(task.report.createdAt).toLocaleString('th-TH') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />Pending Review
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${id}/reviews/${task.id}`}
                        className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
