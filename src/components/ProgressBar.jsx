export default function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar__label">
        {done} / {total}
      </span>
    </div>
  )
}
