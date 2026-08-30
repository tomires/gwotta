import { useEffect } from 'react'
import { wikiUrl, professionIconUrl, assetUrl } from '../lib/utils.js'
import { PROFESSION_COLORS } from '../lib/groupSkills.js'

function WikiLink({ title, children }) {
  return (
    <a className="wiki-link" href={wikiUrl(title)} target="_blank" rel="noreferrer">
      <img className="wiki-link__icon" src={assetUrl('/icons/icon-gww.ico')} alt="" />
      {children}
    </a>
  )
}

// Only Signet of Capture entries represent a real, player-visitable capture
// spot — trainer/quest/unlock methods are noise here now that captureLocations
// already drives the rest of the app.
function groupByRegion(acquisition) {
  const map = new Map()
  let lastCampaign = null
  let lastLocation = null
  for (const entry of acquisition) {
    if (!entry.method || !/capture/i.test(entry.method)) continue
    if (!entry.npc) continue

    // The wiki often lists a second/third boss for the same spot without
    // repeating the location (e.g. "Arlak Stoneleaf (Ice Caves of Sorrow)"
    // then just "Virag Bladestone") — inherit the previous entry's location
    // in that case, as long as we're still in the same campaign.
    let location = entry.location
    if (!location && entry.campaign === lastCampaign) location = lastLocation
    if (location) {
      lastCampaign = entry.campaign
      lastLocation = location
    }

    const key = `${entry.campaign || ''}|||${location || ''}`
    if (!map.has(key)) map.set(key, { campaign: entry.campaign, location, npcs: [] })
    map.get(key).npcs.push(entry.npc)
  }
  return [...map.values()]
}

export default function SkillDetailSidebar({ skill, onClose, captured, onToggle }) {
  const color = PROFESSION_COLORS[skill.profession] ?? PROFESSION_COLORS.Other
  const regionGroups = groupByRegion(skill.acquisition)

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
        {skill.icon && <img className="sidebar__icon" src={assetUrl(skill.icon)} alt="" />}
        <div>
          <h2 className="sidebar__name">
            <WikiLink title={skill.name}>{skill.name}</WikiLink>
          </h2>
          <div className="skill-card__meta">
            {skill.profession && (
              <img
                className="skill-card__profession-icon"
                src={professionIconUrl(skill.profession)}
                alt={skill.profession}
                title={skill.profession}
              />
            )}
            <span className="skill-card__attribute">{skill.attribute || 'No attribute'}</span>
          </div>
        </div>
      </div>

      <p className="sidebar__campaign">
        {skill.campaign}
        {skill.type ? ` · ${skill.type}` : ''}
      </p>

      {skill.description && <p className="sidebar__description">{skill.description}</p>}

      {regionGroups.length === 0 && <p className="sidebar__empty">No capture location data.</p>}
      {regionGroups.map((group, i) => (
        <div key={i} className="sidebar__region-group">
          <div className="sidebar__region-header">
            {group.campaign && <span className="sidebar__entry-campaign">{group.campaign}</span>}
            {group.location ? <WikiLink title={group.location}>{group.location}</WikiLink> : 'Unknown location'}
          </div>
          <ul className="sidebar__npc-list">
            {group.npcs.map((npc) => (
              <li key={npc} className="sidebar__entry">
                <WikiLink title={npc}>{npc}</WikiLink>
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
