import SkillCard from './SkillCard.jsx'
import ProgressBar from './ProgressBar.jsx'

export default function GroupSection({ title, skills, isCaptured, onToggle, onSelect, groupBy }) {
  const done = skills.filter((s) => isCaptured(s.slug)).length
  const contextLocation = groupBy === 'region' ? title : null

  return (
    <section className="group-section">
      <header className="group-section__header">
        <h2>{title}</h2>
        <ProgressBar done={done} total={skills.length} />
      </header>
      <div className="skill-grid">
        {skills.map((skill) => (
          <SkillCard
            key={`${title}-${skill.slug}`}
            skill={skill}
            captured={isCaptured(skill.slug)}
            onToggle={onToggle}
            onSelect={onSelect}
            contextLocation={contextLocation}
          />
        ))}
      </div>
    </section>
  )
}
