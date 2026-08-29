export function wikiUrl(title) {
  return `https://wiki.guildwars.com/wiki/${encodeURIComponent(title.trim().replace(/ /g, '_'))}`
}
