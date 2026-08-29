export function wikiUrl(title) {
  return `https://wiki.guildwars.com/wiki/${encodeURIComponent(title.trim().replace(/ /g, '_'))}`
}

export function professionIconUrl(profession) {
  return `/icons/professions/${profession.toLowerCase()}.png`
}
