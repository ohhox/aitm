import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border border-green-300',
    planning: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    paused: 'bg-gray-100 text-gray-500 border border-gray-300',
    done: 'bg-blue-100 text-blue-700 border border-blue-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[status] || map.paused}`}>
      {(status === 'active' || status === 'done') && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      tasks: { where: { parentId: null }, include: { children: true } },
    },
  })

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    planning: projects.filter((p) => p.status === 'planning').length,
    pending: projects.reduce((sum, p) => {
      const all = p.tasks.flatMap((t) => [t, ...t.children])
      return sum + all.filter((t) => t.status === 'pending_review').length
    }, 0),
    done: projects.filter((p) => p.status === 'done').length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center px-5">
        <span className="text-sm font-semibold text-[#111827]">Dashboard</span>
        <div className="ml-auto">
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors"
          >
            + New Project
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 border-b border-[#E2E6EC] bg-[#E2E6EC] gap-px shrink-0">
        {[
          { label: 'Total Projects', value: stats.total, color: '' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Planning', value: stats.planning, color: 'text-yellow-600' },
          { label: 'Pending Review', value: stats.pending, color: 'text-red-600', alert: stats.pending > 0 },
          { label: 'Completed', value: stats.done, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className={`bg-white px-4 py-3.5 ${s.alert ? 'border-t-2 border-red-500' : ''}`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">{s.label}</div>
            <div className={`text-2xl font-extrabold leading-none mt-1 tracking-tight ${s.color || 'text-[#111827]'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {stats.pending > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-red-700">
            <span className="font-bold">⚠</span>
            <span><strong>{stats.pending} item{stats.pending > 1 ? 's' : ''}</strong> รอ review จากคุณ</span>
            <Link href="/reviews" className="ml-auto bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded transition-colors">
              Review Now →
            </Link>
          </div>
        )}

        <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
          <div className="bg-[#F7F8FA] px-3.5 py-2 border-b border-[#E2E6EC] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">All Projects</span>
            <span className="text-[11px] font-semibold text-[#9CA3AF] bg-[#F7F8FA] border border-[#E2E6EC] px-2 py-0.5 rounded-full">{projects.length}</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E2E6EC]">
                {['Project Name', 'Status', 'Progress', 'Tasks', 'Tech Stack', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const allTasks = p.tasks.flatMap((t) => [t, ...t.children])
                const done = allTasks.filter((t) => t.status === 'done').length
                const total = allTasks.length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                const pending = allTasks.filter((t) => t.status === 'pending_review').length
                const age = Math.round((Date.now() - new Date(p.updatedAt).getTime()) / 60000)
                const ageStr = age < 60 ? `${age}m ago` : age < 1440 ? `${Math.round(age / 60)}h ago` : `${Math.round(age / 1440)}d ago`

                return (
                  <tr key={p.id} className="border-b border-[#E2E6EC] hover:bg-blue-50 cursor-pointer transition-colors group">
                    <td className="px-3.5 py-2.5">
                      <Link href={`/projects/${p.id}`} className="block">
                        <div className="font-semibold text-[13px] text-[#111827]">{p.name}</div>
                        {p.description && <div className="text-[11px] text-[#9CA3AF] mt-0.5 truncate max-w-[240px]">{p.description}</div>}
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5"><StatusPill status={p.status} /></td>
                    <td className="px-3.5 py-2.5 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[5px] bg-[#EEF0F4] rounded-full border border-[#E2E6EC] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.status === 'done' ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#9CA3AF] whitespace-nowrap">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-[13px]">
                      <span className="font-semibold">{done}</span>
                      <span className="text-[#9CA3AF]"> / {total}</span>
                    </td>
                    <td className="px-3.5 py-2.5 text-[12px] text-[#9CA3AF]">{p.techStack || '—'}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-[#9CA3AF]">{ageStr}</td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-1.5">
                        <Link href={`/projects/${p.id}`} className="text-[11px] font-semibold px-2.5 py-1 border border-[#E2E6EC] rounded hover:bg-[#F7F8FA] transition-colors">
                          View
                        </Link>
                        {p.status === 'planning' && (
                          <Link href={`/projects/${p.id}/plan`} className="text-[11px] font-semibold px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            Approve Plan
                          </Link>
                        )}
                        {pending > 0 && (
                          <Link href={`/projects/${p.id}/reviews`} className="text-[11px] font-semibold px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                            Review
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#9CA3AF] text-sm">
                    ยังไม่มีโปรเจด —{' '}
                    <Link href="/projects/new" className="text-blue-600 hover:underline">สร้างโปรเจดแรก</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
