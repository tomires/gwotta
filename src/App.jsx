import { useMemo, useState } from 'react'
import allSkills from './data/skills.json'
import { IGNORED_SKILL_SLUGS } from './data/ignoredSkills.js'
import { useProgress } from './lib/useProgress.js'
import { GROUPERS } from './lib/groupSkills.js'
import FilterBar from './components/FilterBar.jsx'
import GroupSection from './components/GroupSection.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import SkillDetailSidebar from './components/SkillDetailSidebar.jsx'

const skills = allSkills.filter((skill) => !IGNORED_SKILL_SLUGS.has(skill.slug))

const DEFAULT_FILTERS = {
  search: '',
  groupBy: 'profession',
  profession: '',
  campaign: '',
  hideCaptured: false,
}

function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedSkill, setSelectedSkill] = useState(null)
  const { isCaptured, toggle, captured } = useProgress()

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return skills.filter((skill) => {
      if (search && !skill.name.toLowerCase().includes(search)) return false
      if (filters.profession && skill.profession !== filters.profession) return false
      if (filters.campaign && skill.campaign !== filters.campaign) return false
      if (filters.hideCaptured && isCaptured(skill.slug)) return false
      return true
    })
  }, [filters, isCaptured])

  const groups = useMemo(() => GROUPERS[filters.groupBy](filtered), [filters.groupBy, filtered])

  const handleReset = () => {
    if (window.confirm('Clear all captured-skill progress? This cannot be undone.')) {
      for (const skill of skills) {
        if (isCaptured(skill.slug)) toggle(skill.slug)
      }
    }
  }

  return (
    <div className="app-shell">
      <div className="app">
        <header className="app__header">
          <div className="app__title">
            <h1>
              <span className="app__title-accent">gwotta</span>{' '}
              <span className="app__title-secondary">catch 'em all</span>
            </h1>
          </div>
          <div className="app__overall-progress">
            <ProgressBar done={captured.size} total={skills.length} />
            <button type="button" className="app__reset" onClick={handleReset}>
              Reset progress
            </button>
          </div>
        </header>

        <FilterBar filters={filters} onChange={setFilters} />

        <main className="app__content">
          {groups.length === 0 && <p className="app__empty">No skills match your filters.</p>}
          {groups.map((group) => (
            <GroupSection
              key={group.key}
              title={group.key}
              skills={group.skills}
              isCaptured={isCaptured}
              onToggle={toggle}
              onSelect={setSelectedSkill}
              groupBy={filters.groupBy}
            />
          ))}
        </main>
      </div>

      {selectedSkill && <SkillDetailSidebar skill={selectedSkill} onClose={() => setSelectedSkill(null)} />}
    </div>
  )
}

export default App
