import { PROFESSION_COLORS } from '../lib/groupSkills.js'

export default function SkillCard({ skill, captured, onToggle }) {
  const color = PROFESSION_COLORS[skill.profession] ?? PROFESSION_COLORS.Other

  return (
    <button
      type="button"
      className={`skill-card${captured ? ' skill-card--captured' : ''}`}
      style={{ '--profession-color': color }}
      onClick={() => onToggle(skill.slug)}
      aria-pressed={captured}
    >
      <div className="skill-card__icon-wrap">
        {skill.icon && <img className="skill-card__icon" src={skill.icon} alt="" loading="lazy" />}
        <span className="skill-card__check" aria-hidden="true">
          ✓
        </span>
      </div>
      <div className="skill-card__body">
        <div className="skill-card__name">{skill.name}</div>
        <div className="skill-card__meta">
          {skill.profession && <span className="skill-card__badge">{skill.profession}</span>}
          {skill.attribute && <span className="skill-card__attribute">{skill.attribute}</span>}
        </div>
        <div className="skill-card__locations">
          {skill.captureLocations.length > 0
            ? skill.captureLocations.join(' · ')
            : 'Unlocked via quest / trainer'}
        </div>
      </div>
    </button>
  )
}
