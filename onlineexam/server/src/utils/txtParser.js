// Simple .txt parser for MCQs
// Format example:
// Q: 2 + 2 = ?
// A) 3
// B) 4
// C) 5
// D) 6
// ANSWER: B
// --- (blank line between questions)

export function parseMcqTxt(content) {
  const lines = content.split(/\r?\n/)
  const questions = []
  let i = 0
  while (i < lines.length) {
    // skip empty
    while (i < lines.length && !lines[i].trim()) i++
    if (i >= lines.length) break

    let qLine = lines[i++] || ''
    const qMatch = qLine.match(/^\s*(Q:|Q\.)?\s*(.*)$/i)
    const qText = qMatch ? qMatch[2] : qLine.trim()

    const opts = []
    for (let k = 0; k < 4 && i < lines.length; k++) {
      const m = lines[i].match(/^\s*[A-Da-d][\)\.\:]\s*(.*)$/)
      if (m) {
        opts.push(m[1].trim())
        i++
      } else {
        break
      }
    }

    // find ANSWER
    let answerIdx = 0
    while (i < lines.length) {
      const ans = lines[i].match(/^\s*ANSWER\s*[:\-]\s*([A-Da-d0-3]).*$/i)
      if (ans) {
        const token = ans[1].toUpperCase()
        answerIdx = /[A-D]/.test(token) ? token.charCodeAt(0) - 65 : Number(token)
        i++
        break
      }
      if (lines[i].trim() === '') { i++; break }
      i++
    }

    if (qText && opts.length >= 2) {
      questions.push({ type: 'mcq', q: qText, opts, answer: Math.max(0, Math.min(3, answerIdx)) })
    }
  }
  return questions
}
