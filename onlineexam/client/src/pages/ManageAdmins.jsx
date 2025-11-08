import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function ManageAdmins() {
  const [rows, setRows] = useState([{ username: '', password: '' }])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [list, setList] = useState([])
  const [listLoading, setListLoading] = useState(false)

  const fetchList = () => {
    setListLoading(true)
    api.get('/auth/admin/list')
      .then(({ data }) => setList(data || []))
      .catch(() => setList([]))
      .finally(() => setListLoading(false))
  }

  useEffect(() => { fetchList() }, [])

  const addRow = () => setRows(r => [...r, { username: '', password: '' }])
  const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx))
  const editRow = (idx, key, val) => setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: val } : row))

  const saveAll = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const valid = rows.every(r => r.username && r.password)
    if (!valid) { setError('Please fill username and password for all rows'); return }
    setLoading(true)
    Promise.all(rows.map(r => api.post('/auth/admin/add', { username: r.username, password: r.password })))
      .then(() => {
        setMessage('Admins added')
        setRows([{ username: '', password: '' }])
        fetchList()
      })
      .catch(err => setError(err.response?.data?.error || 'Save failed'))
      .finally(() => setLoading(false))
  }

  const onDelete = (id, name) => {
    if (!confirm(`Delete admin ${name}?`)) return
    api.delete(`/auth/admin/${id}`).then(() => fetchList())
      .catch(err => alert(err.response?.data?.error || 'Delete failed'))
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold mb-3">Manage Admins</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={saveAll} className="bg-white border rounded shadow-sm p-6">
          <div className="text-sm text-gray-600 mb-4">Add additional admin users (admin-only access).</div>
          {message && <div className="mb-3 text-sm text-green-700">{message}</div>}
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          <div className="space-y-4">
            {rows.map((r, idx) => (
              <div key={idx} className="border rounded p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">Username</label>
                    <input value={r.username} onChange={e=>editRow(idx, 'username', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="admin username" />
                  </div>
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">Password</label>
                    <input type="password" value={r.password} onChange={e=>editRow(idx, 'password', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="password" />
                  </div>
                </div>
                <div className="flex sm:justify-end">
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(idx)} className="px-3 py-2 rounded border">Remove</button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between">
              <button type="button" onClick={addRow} className="px-3 py-2 rounded border">Add Row</button>
              <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{loading ? 'Saving...' : 'Save All'}</button>
            </div>
          </div>
        </form>

        <div className="bg-white border rounded shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Existing Admins</div>
            <button onClick={fetchList} className="px-2 py-1 rounded border text-sm">Refresh</button>
          </div>
          {listLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-gray-600">No admins found.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Username</th>
                    <th className="py-2 pr-3">Updated</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(u => (
                    <tr key={u._id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{u.name}</td>
                      <td className="py-2 pr-3">{new Date(u.updatedAt || u.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right">
                        <button onClick={() => onDelete(u._id, u.name)} className="px-2 py-1 text-red-700 border border-red-200 rounded hover:bg-red-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
