'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Report {
  id: number
  summary: string
  filesChanged: string | null
  concerns: string | null
  status: string
  createdAt: string
  task: { id: number; title: string; projectId: number }
  review: { decision: string; comments: string | null } | null
}

interface FileChange {
  type: 'new' | 'mod' | 'del'
  path: string
  note?: string
}

export default function ReportReviewPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/tasks/${reportId}/report`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data)
        if (data.review?.comments) setComments(data.review.comments)
      })
  }, [reportId])

  const submit = async (decision: 'approved' | 'revision') => {
    setSubmitting(true)
    await fetch(`/api/tasks/${reportId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comments }),
    })
    router.push(`/projects/${id}`)
  }

  if (!report) return <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">Loading...</div>

  const files: FileChange[] = report.filesChanged ? JSON.parse(report.filesChanged) : []
  const tagStyle = {
    new: 'bg-green-100 text-green-700 border border-green-300',
    mod: 'bg-blue-100 text-blue-700 border border-blue-300',
    del: 'bg-red-100 text-red-700 border border-red-300',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <Link href="/" className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">Dashboard</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <Link href={`/projects/${id}`} className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">Project</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold truncate max-w-[200px]">Report Review</span>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />Pending Review
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_300px]">
        {/* Report content */}
        <div className="overflow-y-auto p-5 space-y-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#111827] tracking-tight">{report.task.title}</h1>
            <div className="text-[12px] text-[#9CA3AF] mt-1">
              Submitted by AI · {new Date(report.createdAt).toLocaleString('th-TH')} · Task #{report.task.id}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
            <div className="bg-[#F7F8FA] px-4 py-2 border-b border-[#E2E6EC] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Summary</div>
            <div className="p-4 text-[13px] text-[#4B5563] leading-relaxed">{report.summary}</div>
          </div>

          {/* Files changed */}
          {files.length > 0 && (
            <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
              <div className="bg-[#F7F8FA] px-4 py-2 border-b border-[#E2E6EC] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] flex justify-between">
                <span>Files Changed</span>
                <span className="font-normal">{files.length} files</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E6EC]">
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] w-16">Type</th>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">File Path</th>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f, i) => (
                    <tr key={i} className="border-b border-[#E2E6EC] hover:bg-[#F7F8FA]">
                      <td className="px-4 py-2.5">
                        <span className={`font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase ${tagStyle[f.type] || tagStyle.mod}`}>
                          {f.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#111827]">{f.path}</td>
                      <td className="px-4 py-2.5 text-[11px] text-[#9CA3AF]">{f.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Concerns */}
          {report.concerns && (
            <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
              <div className="bg-[#F7F8FA] px-4 py-2 border-b border-[#E2E6EC] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Concerns &amp; Questions
              </div>
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <div className="text-[12.5px] text-[#92400E] leading-relaxed whitespace-pre-wrap">{report.concerns}</div>
              </div>
            </div>
          )}
        </div>

        {/* Review sidebar */}
        <div className="border-l border-[#E2E6EC] bg-white flex flex-col gap-4 p-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Your Review</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full h-40 bg-[#F7F8FA] border border-[#E2E6EC] rounded-md p-3 text-[12.5px] text-[#111827] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none leading-relaxed"
              placeholder={"เขียน comment ให้ AI...\n\nเช่น:\n- ย้าย image upload ไป Task 3.5\n- เพิ่ม rate limiting ก่อน approve"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              disabled={submitting}
              onClick={() => submit('revision')}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
            >
              ✕ Needs Revision
            </button>
            <button
              disabled={submitting}
              onClick={() => submit('approved')}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
            >
              ✓ Approve &amp; Continue
            </button>
          </div>

          {report.review && (
            <div className="border-t border-[#E2E6EC] pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Previous Decision</div>
              <div className={`text-[12px] font-semibold ${report.review.decision === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                {report.review.decision === 'approved' ? '✓ Approved' : '↺ Revision Requested'}
              </div>
              {report.review.comments && (
                <div className="mt-1 text-[11.5px] text-[#6B7280]">{report.review.comments}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
