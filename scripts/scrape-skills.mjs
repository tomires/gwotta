// One-off/dev-time scraper: pulls all Elite skills from the Guild Wars Wiki
// (wiki.guildwars.com, MediaWiki API) and writes static data + icons into the
// repo. The running app never calls the wiki — see AGENTS.md.
//
// Usage: node scripts/scrape-skills.mjs

import { writeFile, mkdir, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_OUT = path.join(ROOT, 'src/data/skills.json')
const ICONS_DIR = path.join(ROOT, 'public/icons/skills')

const API = 'https://wiki.guildwars.com/api.php'
const KNOWN_CAMPAIGNS = ['Core', 'Prophecies', 'Factions', 'Nightfall', 'Eye of the North']
// Matches lines like "Prophecies", "Prophecies and Eye of the North", or
// "Factions, Nightfall" — dual/multi-campaign availability declarations that
// are campaign context, not a real acquisition entry.
const CAMPAIGN_LINE_RE = new RegExp(
  `^(?:${KNOWN_CAMPAIGNS.join('|')})(?:\\s*(?:,|and)\\s*(?:${KNOWN_CAMPAIGNS.join('|')}))*$`,
)

async function apiGet(params) {
  const usp = new URLSearchParams({ format: 'json', ...params })
  const res = await fetch(`${API}?${usp.toString()}`, {
    headers: { 'User-Agent': 'gwotta-elite-skill-tracker-scraper/1.0 (dev-time build tool)' },
  })
  if (!res.ok) throw new Error(`API error ${res.status} for ${usp.toString()}`)
  return res.json()
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function fetchAllEliteSkillTitles() {
  const titles = []
  let cmcontinue
  do {
    const data = await apiGet({
      action: 'query',
      list: 'categorymembers',
      cmtitle: 'Category:Elite skills',
      cmnamespace: '0', // article namespace only — excludes subcategory pages
      cmlimit: '500',
      ...(cmcontinue ? { cmcontinue } : {}),
    })
    for (const m of data.query.categorymembers) titles.push(m.title)
    cmcontinue = data.continue?.cmcontinue
  } while (cmcontinue)

  return titles.filter((t) => t !== 'Elite skill' && !/\(PvP\)$/.test(t))
}

async function fetchWikitextBatch(titles) {
  const data = await apiGet({
    action: 'query',
    titles: titles.join('|'),
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
  })
  const pages = Object.values(data.query.pages)
  const out = new Map()
  for (const p of pages) {
    const content = p.revisions?.[0]?.slots?.main?.['*']
    if (content) out.set(p.title, content)
  }
  return out
}

async function fetchIconUrlsBatch(titles) {
  // prop=images paginates across a multi-title query (it fills one page's
  // image list at a time and returns `continue` before moving to the next),
  // so we must keep following `imcontinue` until every title in the batch
  // has been covered.
  const imagesByTitle = new Map()
  let imcontinue
  do {
    const data = await apiGet({
      action: 'query',
      titles: titles.join('|'),
      prop: 'images',
      imlimit: 'max',
      ...(imcontinue ? { imcontinue } : {}),
    })
    for (const p of Object.values(data.query.pages)) {
      if (!p.images) continue
      const existing = imagesByTitle.get(p.title) ?? []
      imagesByTitle.set(p.title, existing.concat(p.images))
    }
    imcontinue = data.continue?.imcontinue
  } while (imcontinue)

  const iconFileTitles = new Map() // skill title -> file title
  for (const title of titles) {
    const images = imagesByTitle.get(title)
    if (!images || images.length === 0) continue
    const plain = title.replace(/\s*\(.*\)$/, '') // strip trailing "(PvP)" style, defensive
    const match = images.find((img) => img.title.slice('File:'.length).startsWith(plain)) ?? images[0]
    iconFileTitles.set(title, match.title)
  }
  return iconFileTitles
}

async function fetchImageInfoBatch(fileTitles) {
  const data = await apiGet({
    action: 'query',
    titles: fileTitles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url',
  })
  const pages = Object.values(data.query.pages)
  const out = new Map()
  for (const p of pages) {
    const url = p.imageinfo?.[0]?.url
    if (url) out.set(p.title, url)
  }
  return out
}

const FRACTIONS = { '1/4': '¼', '1/3': '⅓', '1/2': '½', '2/3': '⅔', '3/4': '¾' }

function stripLinks(text) {
  // [[Target|Display]] -> Display, [[Target]] -> Target
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\{\{gr\|([^|}]+)\|([^|}]+)\}\}/gi, '$1...$2') // {{gr|min|max}} scaling range
    .replace(/\{\{(1\/4|1\/3|1\/2|2\/3|3\/4)\}\}/g, (_, f) => FRACTIONS[f])
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLinks(text) {
  const links = []
  const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g
  let m
  while ((m = re.exec(text))) links.push(m[1].trim())
  return links
}

function parseInfobox(wikitext) {
  const start = wikitext.search(/\{\{\s*Skill infobox/i)
  if (start === -1) return {}
  const lines = wikitext.slice(start).split('\n')
  const fields = {}
  for (const line of lines.slice(1)) {
    if (line.trim() === '}}') break
    const m = line.match(/^\|\s*([a-zA-Z0-9_ ]+?)\s*=\s*(.*)$/)
    if (m) fields[m[1].trim()] = m[2].trim()
  }
  return fields
}

function parseAcquisition(wikitext) {
  const headingRe = /^={2,3}\s*Acquisition\s*={2,3}\s*$/m
  const startMatch = headingRe.exec(wikitext)
  if (!startMatch) return []
  const afterStart = startMatch.index + startMatch[0].length
  const rest = wikitext.slice(afterStart)
  const endMatch = /^==[^=].*==\s*$/m.exec(rest)
  const section = endMatch ? rest.slice(0, endMatch.index) : rest

  const entries = []
  // Some wiki pages omit the '''Signet of Capture''' header entirely when
  // it's the only acquisition method (e.g. "Wounding Strike"), so default to
  // it until a real header says otherwise.
  let currentMethod = 'Signet of Capture'
  let methodExplicitlySet = false
  let currentCampaign = null

  for (const rawLine of section.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    // The closing ''' is frequently missing on this wiki (e.g. "Escape",
    // "Song of Restoration" write '''[[Signet of Capture]] with no closing
    // marks), so treat it as optional rather than requiring a matched pair.
    const boldHeader = line.match(/^'''(.+?)'''?$/)
    const h3Header = line.match(/^===\s*(.+?)\s*===$/)
    const defTerm = line.match(/^;\s*(.+)$/)
    if (boldHeader) {
      currentMethod = stripLinks(boldHeader[1])
      methodExplicitlySet = true
      currentCampaign = null
      continue
    }
    if (h3Header) {
      currentMethod = stripLinks(h3Header[1])
      methodExplicitlySet = true
      currentCampaign = null
      continue
    }
    if (defTerm) {
      // Only compose onto a real preceding header (e.g. "Unlock only" +
      // ";Heroes"). If nothing explicit preceded it, this def-term IS the
      // method (e.g. a lone ";Skill quests" — replace the capture default).
      currentMethod = methodExplicitlySet
        ? `${currentMethod} — ${stripLinks(defTerm[1])}`
        : stripLinks(defTerm[1])
      methodExplicitlySet = true
      continue
    }

    const bullet = line.match(/^(\*+)\s*(.*)$/)
    if (!bullet) continue
    const content = bullet[2]
    const plain = stripLinks(content)

    if (CAMPAIGN_LINE_RE.test(plain)) {
      currentCampaign = plain
      continue
    }

    const links = extractLinks(content)
    if (links.length === 0) continue

    let npc = null
    let location = null
    if (links.length >= 2) {
      npc = links[0]
      location = links[1]
    } else {
      // Single link: could be an NPC-only entry or a location-only entry.
      // Heuristic: if it appears before a "(" it's usually the NPC; with no
      // parens at all, treat it as the acquisition source itself.
      npc = links[0]
    }

    entries.push({
      method: currentMethod,
      campaign: currentCampaign,
      npc,
      location,
      note: plain,
    })
  }

  return entries
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('Fetching Elite skill titles from Category:Elite skills...')
  const titles = await fetchAllEliteSkillTitles()
  console.log(`Found ${titles.length} elite skills (PvP-only variants excluded).`)

  const wikitextByTitle = new Map()
  for (const batch of chunk(titles, 50)) {
    const res = await fetchWikitextBatch(batch)
    for (const [k, v] of res) wikitextByTitle.set(k, v)
  }
  console.log(`Fetched wikitext for ${wikitextByTitle.size} pages.`)

  const iconFileTitleByTitle = new Map()
  for (const batch of chunk(titles, 50)) {
    const res = await fetchIconUrlsBatch(batch)
    for (const [k, v] of res) iconFileTitleByTitle.set(k, v)
  }
  const fileTitles = [...new Set(iconFileTitleByTitle.values())]
  const imageUrlByFileTitle = new Map()
  for (const batch of chunk(fileTitles, 50)) {
    const res = await fetchImageInfoBatch(batch)
    for (const [k, v] of res) imageUrlByFileTitle.set(k, v)
  }
  console.log(`Resolved ${imageUrlByFileTitle.size} icon URLs.`)

  await mkdir(ICONS_DIR, { recursive: true })

  const skills = []
  for (const title of titles) {
    const wikitext = wikitextByTitle.get(title)
    if (!wikitext) {
      console.warn(`No content for "${title}", skipping.`)
      continue
    }
    const infobox = parseInfobox(wikitext)
    const acquisition = parseAcquisition(wikitext)
    const captureLocations = [
      ...new Set(
        acquisition
          .filter((e) => e.method && /capture/i.test(e.method))
          .map((e) => e.location)
          .filter(Boolean),
      ),
    ]

    const slug = slugify(title)
    const fileTitle = iconFileTitleByTitle.get(title)
    const iconUrl = fileTitle ? imageUrlByFileTitle.get(fileTitle) : null
    const iconExt = iconUrl ? path.extname(new URL(iconUrl).pathname) || '.jpg' : '.jpg'
    const iconLocalPath = iconUrl ? `/icons/skills/${slug}${iconExt}` : null

    skills.push({
      id: infobox.id ? Number(infobox.id) : null,
      name: title,
      slug,
      profession: infobox.profession ? stripLinks(infobox.profession) : null,
      campaign: infobox.campaign ? stripLinks(infobox.campaign) : null,
      attribute: infobox.attribute ? stripLinks(infobox.attribute) : null,
      type: infobox.type ? stripLinks(infobox.type) : null,
      special: infobox.special ? stripLinks(infobox.special) : null,
      description: infobox.description ? stripLinks(infobox.description) : null,
      icon: iconLocalPath,
      _iconUrl: iconUrl,
      capturable: captureLocations.length > 0,
      captureLocations,
      acquisition,
    })
  }

  console.log('Downloading icons...')
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let downloaded = 0
  for (const skill of skills) {
    if (!skill._iconUrl) continue
    const dest = path.join(ICONS_DIR, path.basename(skill.icon))
    const alreadyExists = await access(dest, fsConstants.F_OK)
      .then(() => true)
      .catch(() => false)
    if (alreadyExists) {
      downloaded++
      continue
    }
    let res
    for (let attempt = 1; attempt <= 4; attempt++) {
      res = await fetch(skill._iconUrl, {
        headers: { 'User-Agent': 'gwotta-elite-skill-tracker-scraper/1.0 (dev-time build tool)' },
      })
      if (res.ok) break
      await sleep(attempt * 500)
    }
    if (!res.ok) {
      console.warn(`Failed to download icon for ${skill.name}: ${res.status}`)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(dest, buf)
    downloaded++
  }
  console.log(`Downloaded ${downloaded} icons.`)

  for (const skill of skills) delete skill._iconUrl

  skills.sort((a, b) => a.name.localeCompare(b.name))
  await mkdir(path.dirname(DATA_OUT), { recursive: true })
  await writeFile(DATA_OUT, JSON.stringify(skills, null, 2))
  console.log(`Wrote ${skills.length} skills to ${path.relative(ROOT, DATA_OUT)}.`)

  const withoutCapture = skills.filter((s) => !s.capturable)
  console.log(`${withoutCapture.length} skills have no Signet of Capture location (quest/trainer unlock instead).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
