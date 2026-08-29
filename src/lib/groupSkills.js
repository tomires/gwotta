export const PROFESSION_ORDER = [
  'Warrior',
  'Ranger',
  'Monk',
  'Necromancer',
  'Mesmer',
  'Elementalist',
  'Assassin',
  'Ritualist',
  'Paragon',
  'Dervish',
]

export const PROFESSION_COLORS = {
  Warrior: '#dbb561',
  Ranger: '#97c64d',
  Monk: '#7fbed3',
  Necromancer: '#489d5f',
  Mesmer: '#704769',
  Elementalist: '#974c4c',
  Assassin: '#851448',
  Ritualist: '#2fd4ba',
  Paragon: '#8f622b',
  Dervish: '#636d88',
  Monster: '#7f8c8d',
  Other: '#7f8c8d',
}

export const CAMPAIGN_ORDER = [
  'Core',
  'Prophecies',
  'Factions',
  'Nightfall',
  'Eye of the North',
  'Bonus Mission Pack',
]

function orderedGroup(skills, keyFn, order) {
  const map = new Map()
  for (const skill of skills) {
    const key = keyFn(skill) || 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(skill)
  }
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  return keys.map((key) => ({ key, skills: map.get(key) }))
}

export function groupByProfession(skills) {
  return orderedGroup(skills, (s) => s.profession || 'Other', PROFESSION_ORDER)
}

export function groupByCampaign(skills) {
  return orderedGroup(skills, (s) => s.campaign, CAMPAIGN_ORDER)
}

const UNCAPTURABLE_KEY = 'Other (quest / trainer / unlock)'

export function groupByRegion(skills) {
  const map = new Map()
  for (const skill of skills) {
    if (skill.captureLocations.length === 0) {
      if (!map.has(UNCAPTURABLE_KEY)) map.set(UNCAPTURABLE_KEY, [])
      map.get(UNCAPTURABLE_KEY).push(skill)
      continue
    }
    for (const location of skill.captureLocations) {
      if (!map.has(location)) map.set(location, [])
      map.get(location).push(skill)
    }
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === UNCAPTURABLE_KEY) return 1
    if (b === UNCAPTURABLE_KEY) return -1
    return a.localeCompare(b)
  })
  return keys.map((key) => ({ key, skills: map.get(key) }))
}

export const GROUPERS = {
  profession: groupByProfession,
  campaign: groupByCampaign,
  region: groupByRegion,
}
