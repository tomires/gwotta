import { PROFESSION_COLORS } from '../lib/groupSkills.js'

export default function SkillCard({ skill, captured, onToggle, onSelect }) {
  const color = PROFESSION_COLORS[skill.profession] ?? PROFESSION_COLORS.Other

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
        {skill.icon && <img className="skill-card__icon" src={skill.icon} alt="" loading="lazy" />}
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
        <div className="skill-card__name">{skill.name}</div>
        <div className="skill-card__meta">
          {skill.profession && <span className="skill-card__badge">{skill.profession}</span>}
          {skill.attribute && <span className="skill-card__attribute">{skill.attribute}</span>}
        </div>
        <div className="skill-card__locations">
          {skill.captureLocations.length > 0
            ? skill.captureLocations[0] +
              (skill.captureLocations.length > 1 ? ` (+${skill.captureLocations.length - 1})` : '')
            : 'Unlocked via quest / trainer'}
        </div>
      </button>
    </div>
  )
}
