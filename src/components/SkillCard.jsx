import { PROFESSION_COLORS } from '../lib/groupSkills.js'
import { professionIconUrl, assetUrl } from '../lib/utils.js'

export default function SkillCard({ skill, captured, onToggle, onSelect, contextLocation }) {
  const color = PROFESSION_COLORS[skill.profession] ?? PROFESSION_COLORS.Other
  const primaryLocation = contextLocation ?? skill.captureLocations[0]
  const extraCount = skill.captureLocations.length - 1

  return (
    <div
      className={`skill-card${captured ? ' skill-card--captured' : ''}`}
      style={{ '--profession-color': color }}
    >
      <button
        type="button"
        className="skill-card__icon-wrap"
        onClick={() => onToggle(skill.slug)}
        aria-pressed={captured}
        aria-label={`Mark ${skill.name} as ${captured ? 'not captured' : 'captured'}`}
        title={captured ? 'Mark as not captured' : 'Mark as captured'}
      >
        {skill.icon && <img className="skill-card__icon" src={assetUrl(skill.icon)} alt="" loading="lazy" />}
        <span className="skill-card__check" aria-hidden="true">
          ✓
        </span>
      </button>
      <button
        type="button"
        className="skill-card__body"
        onClick={() => onSelect(skill)}
        aria-label={`View details for ${skill.name}`}
      >
        <div className="skill-card__meta">
          {skill.profession && (
            <img
              className="skill-card__profession-icon"
              src={professionIconUrl(skill.profession)}
              alt={skill.profession}
              title={skill.profession}
              loading="lazy"
            />
          )}
          <span className="skill-card__name">{skill.name}</span>
        </div>
        <div className="skill-card__locations">
          {skill.captureLocations.length > 0
            ? primaryLocation + (extraCount > 0 ? ` (+${extraCount})` : '')
            : 'Unlocked via quest / trainer'}
        </div>
      </button>
    </div>
  )
}
