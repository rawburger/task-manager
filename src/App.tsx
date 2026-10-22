import { useState, useEffect, useRef, useMemo } from 'react'
import { FaEdit, FaSortAmountDown, FaSortAmountUp, FaTrash, FaDownload, FaUpload, FaMoon, FaSun, FaTimes, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa'
import './App.css'

type Task = { 
  id: number; 
  title: string; 
  done: boolean; 
  priority: 'low' | 'medium' | 'high'; 
  dueDate?: string;
  category?: string;
  notes?: string;
}

type SortMode = 'id' | 'dueDate'
type Toast = { id: number; message: string; type: 'success' | 'info' | 'error' }
type HistoryEntry = { tasks: Task[]; timestamp: number }

const STORAGE_KEY = 'task-manager-tasks'
const THEME_KEY = 'task-manager-theme'
const HISTORY_KEY = 'task-manager-history'
const MAX_HISTORY = 50

let lastId = 0

const generateId = (): number => {
  const timestamp = Date.now()
  if (timestamp <= lastId) {
    lastId++
  } else {
    lastId = timestamp
  }
  return lastId
}

const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error)
  }
  return [
    { id: 1, title: 'Set up project scaffold', done: true, priority: 'high', category: 'Development' },
    { id: 2, title: 'Build task data layer', done: false, priority: 'medium', dueDate: '2026-10-25', category: 'Development' },
    { id: 3, title: 'Design green & white UI', done: false, priority: 'low', dueDate: '2026-10-23', category: 'Design' },
  ]
}

const loadTheme = (): boolean => {
  try {
    const theme = localStorage.getItem(THEME_KEY)
    return theme === 'dark'
  } catch {
    return false
  }
}

const loadHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    if (data) return JSON.parse(data)
  } catch (error) {
    console.error('Failed to load history from localStorage:', error)
  }
  return []
}

export default function TaskManagerApp() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [input, setInput] = useState('')
  const [prio, setPrio] = useState<Task['priority']>('low')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('id')
  const [sortAsc, setSortAsc] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<Task['priority']>('low')
  const [editDueDate, setEditDueDate] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [darkMode, setDarkMode] = useState(loadTheme)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [scrollTop, setScrollTop] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableBodyRef = useRef<HTMLDivElement>(null)

  // Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
    document.body.classList.toggle('dark-mode', darkMode)
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K - Focus add input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        addInputRef.current?.focus()
      }
      // / - Focus search
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl+Shift+Z or Ctrl+Y - Redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history])

  // Toast auto-dismiss
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(t => t.slice(1))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  // Helper functions
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
  }

  const saveToHistory = (newTasks: Task[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ tasks: newTasks, timestamp: Date.now() })
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const updateTasks = (newTasks: Task[], message?: string) => {
    saveToHistory(tasks)
    setTasks(newTasks)
    if (message) showToast(message)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setTasks(history[newIndex].tasks)
      showToast('Undo', 'info')
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setTasks(history[newIndex].tasks)
      showToast('Redo', 'info')
    }
  }

  const categories = Array.from(new Set(tasks.filter(t => t.category).map(t => t.category!)))

  // Validation functions
  const validateTitle = (title: string, excludeId?: number): { valid: boolean; message?: string } => {
    const trimmed = title.trim()
    if (!trimmed) {
      return { valid: false, message: 'Title cannot be empty' }
    }
    const duplicate = tasks.find(t => t.title.toLowerCase() === trimmed.toLowerCase() && t.id !== excludeId)
    if (duplicate) {
      return { valid: false, message: 'A task with this title already exists' }
    }
    return { valid: true }
  }

  const validateDate = (date: string): { valid: boolean; message?: string } => {
    if (!date) return { valid: true } // Optional date
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(selectedDate.getTime())) {
      return { valid: false, message: 'Invalid date format' }
    }
    
    // Allow past dates but warn
    if (selectedDate < today) {
      return { valid: true } // Still valid, just in the past
    }
    
    // Check if date is too far in the future (e.g., 10 years)
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 10)
    if (selectedDate > maxDate) {
      return { valid: false, message: 'Due date cannot be more than 10 years in the future' }
    }
    
    return { valid: true }
  }

  // Task actions
  const add = () => {
    const titleValidation = validateTitle(input)
    if (!titleValidation.valid) {
      showToast(titleValidation.message!, 'error')
      return
    }

    const dateValidation = validateDate(dueDate)
    if (!dateValidation.valid) {
      showToast(dateValidation.message!, 'error')
      return
    }

    const newTask: Task = { 
      id: generateId(), 
      title: input.trim(), 
      done: false, 
      priority: prio, 
      dueDate: dueDate || undefined,
      category: category || undefined,
      notes: notes || undefined
    }
    updateTasks([...tasks, newTask], 'Task added')
    setInput('')
    setDueDate('')
    setCategory('')
    setNotes('')
  }

  const toggle = (id: number) => {
    const task = tasks.find(t => t.id === id)
    updateTasks(
      tasks.map(x => x.id === id ? { ...x, done: !x.done } : x),
      task?.done ? 'Task marked incomplete' : 'Task completed'
    )
  }

  const remove = (id: number) => {
    updateTasks(tasks.filter(x => x.id !== id), 'Task deleted')
  }

  const deleteCompleted = () => {
    const count = tasks.filter(t => t.done).length
    updateTasks(tasks.filter(x => !x.done), `${count} completed task${count !== 1 ? 's' : ''} deleted`)
  }

  const markAllDone = () => {
    updateTasks(tasks.map(x => ({ ...x, done: true })), 'All tasks marked complete')
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditDueDate(task.dueDate || '')
    setEditCategory(task.category || '')
    setEditNotes(task.notes || '')
  }

  const saveEdit = (id: number) => {
    const titleValidation = validateTitle(editTitle, id)
    if (!titleValidation.valid) {
      showToast(titleValidation.message!, 'error')
      return
    }

    const dateValidation = validateDate(editDueDate)
    if (!dateValidation.valid) {
      showToast(dateValidation.message!, 'error')
      return
    }

    updateTasks(
      tasks.map(x => x.id === id ? { 
        ...x, 
        title: editTitle.trim(), 
        priority: editPriority, 
        dueDate: editDueDate || undefined,
        category: editCategory || undefined,
        notes: editNotes || undefined
      } : x),
      'Task updated'
    )
    setEditingId(null)
    setEditTitle('')
    setEditPriority('low')
    setEditDueDate('')
    setEditCategory('')
    setEditNotes('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditPriority('low')
    setEditDueDate('')
    setEditCategory('')
    setEditNotes('')
  }

  // Import/Export
  const exportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    showToast('Tasks exported as JSON')
  }

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Done', 'Priority', 'Due Date', 'Category', 'Notes']
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.done,
      t.priority,
      t.dueDate || '',
      t.category || '',
      t.notes ? `"${t.notes.replace(/"/g, '""')}"` : ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const dataBlob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('Tasks exported as CSV')
  }

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          updateTasks(imported, `Imported ${imported.length} tasks`)
        } else {
          showToast('Invalid JSON format', 'error')
        }
      } catch (error) {
        console.error('Failed to import tasks:', error)
        showToast('Failed to import tasks', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Filtering and sorting
  const visible = useMemo(() => 
    tasks
      .filter(t =>
        (filter === 'all' ? true : filter === 'done' ? t.done : !t.done) &&
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        (categoryFilter === 'all' || t.category === categoryFilter) &&
        (searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        if (sortMode === 'dueDate') {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return sortAsc ? aDate - bDate : bDate - aDate
        }
        // Default: sort by ID
        return sortAsc ? a.id - b.id : b.id - a.id
      }),
    [tasks, filter, priorityFilter, categoryFilter, searchQuery, sortMode, sortAsc]
  )

  // Virtual scrolling configuration
  const ITEM_HEIGHT = 50 // Base height per row
  const CONTAINER_HEIGHT = 600 // Max visible height
  const BUFFER = 5 // Extra items to render above/below viewport

  const visibleStart = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER)
  const visibleEnd = Math.min(visible.length, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + BUFFER)
  const visibleTasks = visible.slice(visibleStart, visibleEnd)
  const offsetY = visibleStart * ITEM_HEIGHT
  const totalHeight = visible.length * ITEM_HEIGHT

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const total = tasks.length
  const done = tasks.filter(t => t.done).length
  const overdue = tasks.filter(t => {
    if (!t.dueDate || t.done) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(t.dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="task-container">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <FaCheckCircle />}
            {toast.message}
            <button className="toast-close" onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))}>
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      <div className="header">
        <h1>Manage Tasks</h1>
        <div className="header-actions">
          <button className="btn icon-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="btn icon-btn" onClick={exportJSON} title="Export JSON">
            <FaDownload />
          </button>
          <button className="btn icon-btn" onClick={exportCSV} title="Export CSV">
            <FaDownload />
          </button>
          <button className="btn icon-btn" onClick={() => fileInputRef.current?.click()} title="Import JSON">
            <FaUpload />
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".json" 
            onChange={importJSON} 
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="task-table">
        <div className="content-layout">
          <div className="stats-panel">
            <h2>Overview</h2>
            <div className="stats">
              <span className="stat">Total: {total}</span>
              <span className="stat">Completed: {done}</span>
              <span className="stat">Overdue: {overdue}</span>
            </div>
            <div className="progress-section">
              <div className="progress-label">Progress: {progress}%</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="task-workspace">
            <div className="add-form">
              <input 
                ref={addInputRef}
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Add a new task (Ctrl+K)" 
                onKeyDown={e => e.key === 'Enter' && add()} 
              />
              <select value={prio} onChange={e => setPrio(e.target.value as Task['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              <input 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="Category" 
                list="categories"
              />
              <datalist id="categories">
                {categories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
              <input 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Notes (optional)" 
              />
              <button className="btn" onClick={add}>Add</button>
            </div>

            <div className="bar">
              <input 
                ref={searchInputRef}
                placeholder="Search (press /)" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                aria-label="Search tasks"
              />
              <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="done">Done</option>
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as 'all' | Task['priority'])}>
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}>
                <option value="id">Sort by Date Added</option>
                <option value="dueDate">Sort by Due Date</option>
              </select>
              <button className="btn" onClick={deleteCompleted} disabled={done === 0}>Delete Completed</button>
              <button className="btn" onClick={markAllDone} disabled={total === done}>Mark All Done</button>
              <button className="btn icon-btn sort-btn" onClick={() => setSortAsc(!sortAsc)} title={sortAsc ? 'Sort Descending' : 'Sort Ascending'} aria-label={sortAsc ? 'Sort Descending' : 'Sort Ascending'} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none' }}>
                {sortAsc ? <FaSortAmountUp aria-hidden="true" /> : <FaSortAmountDown aria-hidden="true" />}
              </button>
            </div>

            <div className="table-wrapper" style={{ maxHeight: visible.length > 100 ? `${CONTAINER_HEIGHT}px` : 'none', overflow: visible.length > 100 ? 'auto' : 'visible' }} onScroll={visible.length > 100 ? handleScroll : undefined} ref={tableBodyRef}>
              <table className="task-list">
                <colgroup>
                  <col className="status-column" />
                  <col className="task-column" />
                  <col className="priority-column" />
                  <col className="category-column" />
                  <col className="date-column" />
                  <col className="actions-column" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Task</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Category</th>
                    <th scope="col">Due Date</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td className="empty" colSpan={6}>
                        <div className="empty-state">
                          <FaCheckCircle className="empty-icon" />
                          <div>No tasks found</div>
                          <div className="empty-hint">
                            {searchQuery || filter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' 
                              ? 'Try adjusting your filters' 
                              : 'Add your first task to get started'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {visible.length > 100 && (
                        <tr style={{ height: `${offsetY}px` }}>
                          <td colSpan={6} style={{ padding: 0, border: 'none' }}></td>
                        </tr>
                      )}
                      {(visible.length > 100 ? visibleTasks : visible).map(t => (
                        <>
                          <tr key={t.id} className={`task ${t.done ? 'done' : ''}`}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={t.done}
                            onChange={() => toggle(t.id)}
                            aria-label={`Mark "${t.title}" as ${t.done ? 'incomplete' : 'complete'}`}
                          />
                        </td>
                        <td className="title-cell">
                          {editingId === t.id ? (
                            <input
                              className="edit-input"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(t.id)
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              autoFocus
                            />
                          ) : (
                            <div className="title-wrapper">
                              <div className="title">{t.title}</div>
                              {t.notes && (
                                <button 
                                  className="notes-toggle" 
                                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                                  title="View notes"
                                >
                                  {expandedId === t.id ? '▼' : '▶'} Notes
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {editingId === t.id ? (
                            <select className="edit-priority" value={editPriority} onChange={e => setEditPriority(e.target.value as Task['priority'])}>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          ) : (
                            <span className={`prio prio-enhanced ${t.priority}`}>{t.priority}</span>
                          )}
                        </td>
                        <td>
                          {editingId === t.id ? (
                            <input 
                              className="edit-category" 
                              value={editCategory} 
                              onChange={e => setEditCategory(e.target.value)} 
                              placeholder="Category"
                              list="categories"
                            />
                          ) : (
                            <span className="category-badge">{t.category || '-'}</span>
                          )}
                        </td>
                        <td>
                          {editingId === t.id ? (
                            <input type="date" className="edit-date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                          ) : (
                            <span className={t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)) && !t.done ? 'overdue-date' : ''}>
                              {t.dueDate ? (
                                <>
                                  <FaCalendarAlt className="date-icon" />
                                  {t.dueDate}
                                </>
                              ) : '-'}
                            </span>
                          )}
                        </td>
                        <td className="actions">
                          {editingId === t.id ? (
                            <>
                              <button className="btn" onClick={() => saveEdit(t.id)}>Save</button>
                              <button className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn icon-btn edit-btn" onClick={() => startEdit(t)} title="Edit" aria-label="Edit">
                                <FaEdit aria-hidden="true" />
                              </button>
                              <button className="btn icon-btn delete-btn" onClick={() => remove(t.id)} title="Delete" aria-label="Delete">
                                <FaTrash aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      {expandedId === t.id && t.notes && editingId !== t.id && (
                        <tr className="notes-row">
                          <td colSpan={6}>
                            <div className="notes-content">{t.notes}</div>
                          </td>
                        </tr>
                      )}
                      {editingId === t.id && (
                        <tr className="edit-notes-row">
                          <td colSpan={6}>
                            <textarea 
                              className="edit-notes"
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              placeholder="Add notes..."
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {visible.length > 100 && (
                    <tr style={{ height: `${totalHeight - offsetY - (visibleEnd - visibleStart) * ITEM_HEIGHT}px` }}>
                      <td colSpan={6} style={{ padding: 0, border: 'none' }}></td>
                    </tr>
                  )}
                </>
              )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
