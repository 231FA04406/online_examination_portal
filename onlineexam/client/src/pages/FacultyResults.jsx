import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function FacultyResults() {
  const [exams, setExams] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [subs, setSubs] = useState([])
  const [loadingExams, setLoadingExams] = useState(false)
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingExams(true)
    api.get('/exams/mine')
      .then(({ data }) => setExams(data || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load exams'))
      .finally(() => setLoadingExams(false))
  }, [])

  const loadSubs = (id) => {
    if (!id) { setSubs([]); return }
    setLoadingSubs(true)
    api.get(`/submissions/exam/${id}`)
      .then(({ data }) => setSubs(data || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load submissions'))
      .finally(() => setLoadingSubs(false))
  }

  const onSelect = (e) => {
    const id = e.target.value
    setSelectedId(id)
    loadSubs(id)
  }

  const selectedExam = exams.find(x => x._id === selectedId)

  const toCsv = (items) => {
    const esc = (v) => {
      const s = v == null ? '' : String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const header = ['Student','Reg No','Score','Auto','Manual','Status','Submitted At','Tab Switches']
    const rows = items.map(s => [
      s.user?.name || '-',
      s.user?.regNo || '-',
      s.score ?? '',
      s.scoreAuto ?? '',
      s.scoreManual ?? '',
      s.status || '',
      s.createdAt ? new Date(s.createdAt).toISOString() : '',
      typeof s.tabSwitches === 'number' ? s.tabSwitches : '',
    ])
    return [header, ...rows].map(r => r.map(esc).join(',')).join('\n')
  }

  const downloadCsv = () => {
    const namePart = selectedExam ? `${selectedExam.title.replace(/[^a-z0-9]+/gi,'_')}_${selectedExam.code || selectedExam._id}` : 'results'
    const csv = toCsv(subs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${namePart}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-semibold mb-3">Results</h1>
      <div className="bg-white border rounded p-4 mb-4">
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm text-blue-700 mb-1">Select Exam</label>
            {loadingExams ? (
              <div className="text-sm text-gray-600">Loading exams...</div>
            ) : (
              <select value={selectedId} onChange={onSelect} className="w-full border rounded px-3 py-2">
                <option value="">-- Choose an exam --</option>
                {exams.map(x => (
                  <option key={x._id} value={x._id}>{x.title} ({x.category})</option>
                ))}
              </select>
            )}
          </div>
          {selectedExam && (
            <div className="text-sm text-gray-700">
              Duration: {selectedExam.durationMin} min • Questions: {selectedExam.questions?.length || 0}
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="bg-white border rounded p-4">
        {loadingSubs ? (
          <div className="text-sm text-gray-600">Loading submissions...</div>
        ) : !selectedId ? (
          <div className="text-sm text-gray-600">Choose an exam to view results.</div>
        ) : subs.length === 0 ? (
          <div className="text-sm text-gray-600">No submissions yet.</div>
        ) : (
          <div className="overflow-auto">
            <div className="flex justify-end mb-2">
              <button onClick={downloadCsv} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm">Download CSV</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Reg No</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Auto</th>
                  <th className="py-2 pr-3">Manual</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Submitted At</th>
                  <th className="py-2 pr-3">Tab Switches</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s._id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{s.user?.name || '-'}</td>
                    <td className="py-2 pr-3">{s.user?.regNo || '-'}</td>
                    <td className="py-2 pr-3">{s.score ?? '-'}</td>
                    <td className="py-2 pr-3">{s.scoreAuto ?? '-'}</td>
                    <td className="py-2 pr-3">{s.scoreManual ?? '-'}</td>
                    <td className="py-2 pr-3">{s.status}</td>
                    <td className="py-2 pr-3">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3">{typeof s.tabSwitches === 'number' ? s.tabSwitches : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
