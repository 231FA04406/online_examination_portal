import { Link, useLocation } from 'react-router-dom'

export default function CreateExamOptions() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const type = params.get('type') === 'reexam' ? 'reexam' : 'normal'
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Create {type === 'reexam' ? 'Re-Exam' : 'Exam'}</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to={`/admin/create-exam${type === 'reexam' ? '?type=reexam' : ''}`} className="block border rounded-lg p-6 hover:border-blue-500">
          <div className="text-lg font-medium mb-2">Enter Questions</div>
          <div className="text-sm text-gray-600">Build the exam by entering questions manually.</div>
        </Link>
        <Link to={`/admin/upload-txt${type === 'reexam' ? '?type=reexam' : ''}`} className="block border rounded-lg p-6 hover:border-blue-500">
          <div className="text-lg font-medium mb-2">Upload .txt</div>
          <div className="text-sm text-gray-600">Prepare a .txt file and upload to create the exam quickly.</div>
        </Link>
      </div>
    </div>
  )
}
