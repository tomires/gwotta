export function wikiUrl(title) {
  return `https://wiki.guildwars.com/wiki/${encodeURIComponent(title.trim().replace(/ /g, '_'))}`
}

// Root-relative paths (from skills.json, or hardcoded elsewhere) need
// rewriting against Vite's actual base path — without this they 404 once the
// app is deployed under a subpath (e.g. a GitHub Pages project site).
export function assetUrl(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

export function professionIconUrl(profession) {
  return assetUrl(`/icons/professions/${profession.toLowerCase()}.png`)
}
