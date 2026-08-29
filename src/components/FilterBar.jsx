import { PROFESSION_ORDER, CAMPAIGN_ORDER } from '../lib/groupSkills.js'

// Every skill tagged with these campaigns turned out to be a special/ignored
// skill (see ignoredSkills.js), so no real skill is ever in either campaign
// — hide them from the filter so they don't dead-end the picker.
const CAMPAIGN_FILTER_OPTIONS = CAMPAIGN_ORDER.filter(
  (c) => c !== 'Eye of the North' && c !== 'Bonus Mission Pack',
)

export default function FilterBar({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className="filter-bar">
      <input
        type="search"
        className="filter-bar__search"
        placeholder="Search skills..."
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
      />

      <div className="filter-bar__group">
        <label>Group by</label>
        <select value={filters.groupBy} onChange={(e) => set({ groupBy: e.target.value })}>
          <option value="profession">Profession</option>
          <option value="campaign">Campaign</option>
          <option value="region">Capture region</option>
        </select>
      </div>

      <div className="filter-bar__group">
        <label>Profession</label>
        <select value={filters.profession} onChange={(e) => set({ profession: e.target.value })}>
          <option value="">All</option>
          {PROFESSION_ORDER.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-bar__group">
        <label>Campaign</label>
        <select value={filters.campaign} onChange={(e) => set({ campaign: e.target.value })}>
          <option value="">All</option>
          {CAMPAIGN_FILTER_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <label className="filter-bar__checkbox">
        <input
          type="checkbox"
          checked={filters.hideCaptured}
          onChange={(e) => set({ hideCaptured: e.target.checked })}
        />
        Hide captured
      </label>
    </div>
  )
}
