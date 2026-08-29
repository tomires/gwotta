import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gwotta:captured-skills'

function loadCaptured() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

export function useProgress() {
  const [captured, setCaptured] = useState(loadCaptured)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...captured]))
  }, [captured])

  const toggle = useCallback((slug) => {
    setCaptured((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }, [])

  const isCaptured = useCallback((slug) => captured.has(slug), [captured])

  return { captured, isCaptured, toggle }
}
