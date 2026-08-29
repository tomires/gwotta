# Guild Wars Elite Skill Tracker

## Aim

Build a web app in React that helps a Guild Wars (original, not GW2) player track which
Elite skills they have captured across their characters.

## Core features

- **Skill data is pre-scraped, not fetched at runtime.** The full list of
  Elite skills, along with their profession, campaign, and capture
  location(s), is scraped from the Guild Wars Wiki (https://wiki.guildwars.com)
  as a build-time/dev-time step and checked into the repo as static data
  (e.g. JSON). The running app never hits the wiki directly.
- **Browsing/organization.** Present Elite skills categorized by:
  - Profession (Warrior, Ranger, Monk, Necromancer, Mesmer, Elementalist,
    Assassin, Ritualist, Paragon, Dervish)
  - Campaign/chapter (Core, Prophecies, Factions, Nightfall, Eye of the North)
  - Region where the skill can be captured
- **Progress tracking.** The user can mark skills as captured/not captured.
  This progress is persisted in the browser's `localStorage` — no backend,
  no accounts.
- **PWA.** The app is installable and works fully offline (manifest +
  service worker), fitting naturally with the pre-scraped/static-data and
  cached-icons approach above.

## Non-goals

- No runtime scraping or live network calls to the wiki.
- No server-side component or database; all state lives client-side.

## Notes for implementation

- The scraper is a separate, one-off/dev-time tool (run manually when skill
  data needs refreshing) and should live apart from the app's runtime code.
- Scraped data should be committed as static assets so the app works fully
  offline.
- Skill icons should be cached on our side instead of pointing at GWW resources.
