import { useCallback, useEffect, useState } from 'react'
import { captureStorageKey } from './useProgress.js'

const CHARACTERS_KEY = 'gwotta:characters'
const ACTIVE_KEY = 'gwotta:active-character-id'
const LEGACY_CAPTURED_KEY = 'gwotta:captured-skills'

function generateId() {
  return `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function bootstrapDefaultCharacter() {
  const id = generateId()
  const characters = [{ id, name: 'Character' }]
  localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters))
  localStorage.setItem(ACTIVE_KEY, id)

  // Carry over progress from the old single-character storage format, if any,
  // rather than silently losing it the first time this runs.
  try {
    const legacy = localStorage.getItem(LEGACY_CAPTURED_KEY)
    if (legacy) {
      localStorage.setItem(captureStorageKey(id), legacy)
      localStorage.removeItem(LEGACY_CAPTURED_KEY)
    }
  } catch {
    // ignore
  }

  return characters
}

function loadCharacters() {
  try {
    const raw = localStorage.getItem(CHARACTERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fall through to bootstrap
  }
  return bootstrapDefaultCharacter()
}

function loadActiveId(characters) {
  const stored = localStorage.getItem(ACTIVE_KEY)
  if (stored && characters.some((c) => c.id === stored)) return stored
  return characters[0]?.id ?? null
}

export function useCharacters() {
  const [characters, setCharacters] = useState(loadCharacters)
  const [activeId, setActiveId] = useState(() => loadActiveId(characters))

  useEffect(() => {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters))
  }, [characters])

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  const addCharacter = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = generateId()
    setCharacters((prev) => [...prev, { id, name: trimmed }])
    setActiveId(id)
  }, [])

  const renameCharacter = useCallback((id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)))
  }, [])

  const deleteCharacter = useCallback(
    (id) => {
      localStorage.removeItem(captureStorageKey(id))
      setCharacters((prev) => {
        const next = prev.filter((c) => c.id !== id)
        if (next.length > 0) {
          if (id === activeId) setActiveId(next[0].id)
          return next
        }
        const fallback = { id: generateId(), name: 'Character' }
        setActiveId(fallback.id)
        return [fallback]
      })
    },
    [activeId],
  )

  return { characters, activeId, setActiveId, addCharacter, renameCharacter, deleteCharacter }
}
