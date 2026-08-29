import { useCallback, useEffect, useState } from 'react'

export function captureStorageKey(characterId) {
  return `gwotta:captured:${characterId}`
}

function loadCaptured(characterId) {
  try {
    const raw = localStorage.getItem(captureStorageKey(characterId))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function useProgress(characterId) {
  const [captured, setCaptured] = useState(() => loadCaptured(characterId))

  // Switching characters reloads their saved set. Writes happen inline inside
  // toggle() (not a separate effect keyed on `captured`) so there's no race
  // where a stale set gets persisted under the newly-active character's key.
  useEffect(() => {
    setCaptured(loadCaptured(characterId))
  }, [characterId])

  const toggle = useCallback(
    (slug) => {
      setCaptured((prev) => {
        const next = new Set(prev)
        if (next.has(slug)) next.delete(slug)
        else next.add(slug)
        localStorage.setItem(captureStorageKey(characterId), JSON.stringify([...next]))
        return next
      })
    },
    [characterId],
  )

  const isCaptured = useCallback((slug) => captured.has(slug), [captured])

  return { captured, isCaptured, toggle }
}
