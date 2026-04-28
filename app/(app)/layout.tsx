'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Project {
  id: number
  name: string
  status: string
  pendingReviews: number
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [totalPending, setTotalPending] = useState(0)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        setProjects(data)
        setTotalPending(data.reduce((s: number, p: Project) => s + (p.pendingReviews || 0), 0))
      })
      .catch(() => {})
  }, [pathname])

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-[220px] min-w-[220px] bg-[#1A2535] flex flex-col h-full overflow-hidden">
        {/* Brand */}
        <div className="h-[52px] flex items-center gap-2.5 px-4 border-b border-white/[0.07]">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0">
            AI
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">TaskFlow</div>
            <div className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5">AI Task Manager</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          <div className="text-white/25 text-[9.5px] font-bold uppercase tracking-widest px-2 pt-3 pb-1">Overview</div>
          <Link
            href="/"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              pathname === '/' ? 'bg-blue-600 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white/90'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" />
            </svg>
            Dashboard
          </Link>

          <div className="text-white/25 text-[9.5px] font-bold uppercase tracking-widest px-2 pt-3 pb-1">Projects</div>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                isActive(`/projects/${p.id}`)
                  ? 'bg-blue-600 text-white'
                  : 'text-white/40 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 3a1 1 0 011-1h4a1 1 0 011 1v1h6a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V3z" />
              </svg>
              <span className="truncate flex-1">{p.name}</span>
              {p.status === 'planning' && (
                <span className="text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-1.5 py-0.5 rounded shrink-0">plan</span>
              )}
              {p.pendingReviews > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              )}
            </Link>
          ))}
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <span className="text-lg leading-none -mt-0.5">+</span>
            New Project
          </Link>

          <div className="text-white/25 text-[9.5px] font-bold uppercase tracking-widest px-2 pt-3 pb-1">Reviews</div>
          <Link
            href="/reviews"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              pathname === '/reviews' ? 'bg-blue-600 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white/90'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 1h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2zm1 4h6v1H5zm0 3h6v1H5zm0 3h4v1H5z" />
            </svg>
            Pending Reviews
            {totalPending > 0 && (
              <span className="ml-auto bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {totalPending}
              </span>
            )}
          </Link>
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.07] p-2.5">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              W
            </div>
            <div>
              <div className="text-white/70 text-[12px] font-semibold">Admin</div>
              <div className="text-white/30 text-[10px]">Local</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
