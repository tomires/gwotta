import { useEffect } from 'react'
import { wikiUrl } from '../lib/utils.js'
import { PROFESSION_COLORS } from '../lib/groupSkills.js'

const NBSP = ' '

function WikiLink({ title, children }) {
  return (
    <a className="wiki-link" href={wikiUrl(title)} target="_blank" rel="noreferrer">
      <img className="wiki-link__icon" src="/icons/icon-gww.ico" alt="" />
      {children}
    </a>
  )
}

function groupByMethod(acquisition) {
  const map = new Map()
  for (const entry of acquisition) {
    const key = entry.method || 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(entry)
  }
  return [...map.entries()]
}

export default function SkillDetailSidebar({ skill, onClose, captured, onToggle }) {
  const color = PROFESSION_COLORS[skill.profession] ?? PROFESSION_COLORS.Other
  const methodGroups = groupByMethod(skill.acquisition)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside className="sidebar" style={{ '--profession-color': color }}>
      <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="sidebar__header">
        {skill.icon && <img className="sidebar__icon" src={skill.icon} alt="" />}
        <div>
          <h2 className="sidebar__name">
            <WikiLink title={skill.name}>{skill.name}</WikiLink>
          </h2>
          <div className="skill-card__meta">
            {skill.profession && <span className="skill-card__badge">{skill.profession}</span>}
            {skill.attribute && <span className="skill-card__attribute">{skill.attribute}</span>}
          </div>
        </div>
      </div>

      <p className="sidebar__campaign">
        {skill.campaign}
        {skill.type ? ` · ${skill.type}` : ''}
      </p>

      {skill.description && <p className="sidebar__description">{skill.description}</p>}

      <h3 className="sidebar__section-title">Acquisition</h3>
      {methodGroups.length === 0 && <p className="sidebar__empty">No acquisition data.</p>}
      {methodGroups.map(([method, entries]) => (
        <div key={method} className="sidebar__method-group">
          <div className="sidebar__method-name">{method}</div>
          <ul className="sidebar__entry-list">
            {entries.map((entry, i) => (
              <li key={i} className="sidebar__entry">
                {entry.campaign && <span className="sidebar__entry-campaign">{entry.campaign}</span>}
                {entry.npc ? <WikiLink title={entry.npc}>{entry.npc}</WikiLink> : null}
                {entry.location ? (
                  entry.npc ? (
                    <span className="sidebar__entry-location">
                      {` (${NBSP}`}
                      <WikiLink title={entry.location}>{entry.location}</WikiLink>
                      {`${NBSP})`}
                    </span>
                  ) : (
                    <WikiLink title={entry.location}>{entry.location}</WikiLink>
                  )
                ) : null}
                {!entry.npc && !entry.location && entry.note}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button
        type="button"
        className={`sidebar__toggle-captured${captured ? ' sidebar__toggle-captured--captured' : ''}`}
        onClick={() => onToggle(skill.slug)}
        aria-pressed={captured}
      >
        {captured ? '✓ Captured' : 'Mark as captured'}
      </button>
    </aside>
  )
}
