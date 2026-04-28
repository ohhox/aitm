import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function GlobalReviewsPage() {
  const pending = await prisma.task.findMany({
    where: { status: 'pending_review' },
    include: {
      project: { select: { id: true, name: true } },
      report: { select: { createdAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <Link href="/" className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">Dashboard</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold">All Pending Reviews</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
          <div className="bg-[#F7F8FA] px-3.5 py-2 border-b border-[#E2E6EC] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Pending Reviews — All Projects ({pending.length})
          </div>
          {pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#9CA3AF]">ไม่มีรายการรอ review</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E2E6EC]">
                  {['Task', 'Project', 'Submitted', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] bg-[#F7F8FA]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((task) => (
                  <tr key={task.id} className="border-b border-[#E2E6EC] hover:bg-blue-50">
                    <td className="px-4 py-3 font-semibold text-[13px]">{task.title}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B7280]">
                      <Link href={`/projects/${task.project.id}`} className="hover:text-blue-600">
                        {task.project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">
                      {task.report ? new Date(task.report.createdAt).toLocaleString('th-TH') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${task.project.id}/reviews/${task.id}`}
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
