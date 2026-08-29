export default function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const complete = total > 0 && done === total
  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill${complete ? ' progress-bar__fill--complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="progress-bar__label">
        {done} / {total}
      </span>
    </div>
  )
}
