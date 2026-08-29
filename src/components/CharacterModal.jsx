import { useEffect, useState } from 'react'

export default function CharacterModal({ characters, activeId, onSelect, onAdd, onRename, onDelete, onClose }) {
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const startEditing = (character) => {
    setEditingId(character.id)
    setEditingName(character.name)
  }

  const saveEditing = () => {
    onRename(editingId, editingName)
    setEditingId(null)
  }

  const handleDelete = (character) => {
    if (window.confirm(`Delete "${character.name}" and all of its captured-skill progress?`)) {
      onDelete(character.id)
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onAdd(newName)
    setNewName('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Characters</h2>
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <ul className="character-list">
          {characters.map((c) => (
            <li key={c.id} className={`character-list__row${c.id === activeId ? ' character-list__row--active' : ''}`}>
              {editingId === c.id ? (
                <input
                  className="character-list__input"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditing()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <button type="button" className="character-list__name" onClick={() => onSelect(c.id)}>
                  {c.id === activeId && <span className="character-list__check">✓</span>}
                  {c.name}
                </button>
              )}

              <div className="character-list__actions">
                {editingId === c.id ? (
                  <button type="button" className="character-switcher__btn" onClick={saveEditing} title="Save">
                    ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    className="character-switcher__btn"
                    onClick={() => startEditing(c)}
                    title="Rename"
                  >
                    ✎
                  </button>
                )}
                <button
                  type="button"
                  className="character-switcher__btn character-switcher__btn--danger"
                  onClick={() => handleDelete(c)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form className="character-add" onSubmit={handleAdd}>
          <input
            className="character-list__input"
            placeholder="New character name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="character-switcher__btn" title="Add character">
            +
          </button>
        </form>
      </div>
    </div>
  )
}
