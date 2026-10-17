import { useState } from 'react'
import './App.css'

type Task = { id: number; title: string; done: boolean; priority: 'low' | 'medium' | 'high' }

const initial: Task[] = [
  { id: 1, title: 'Set up project scaffold', done: true, priority: 'high' },
  { id: 2, title: 'Build task data layer', done: false, priority: 'medium' },
  { id: 3, title: 'Design green & white UI', done: false, priority: 'low' },
]

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(initial)
  const [input, setInput] = useState('')
  const [prio, setPrio] = useState<Task['priority']>('low')
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')

  const add = () => {
    if (!input.trim()) return
    setTasks(t => [...t, { id: Date.now(), title: input.trim(), done: false, priority: prio }])
    setInput('')
  }
  const toggle = (id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const remove = (id: number) => setTasks(t => t.filter(x => x.id !== id))

  const visible = tasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  )

  const total = tasks.length
  const done = tasks.filter(t => t.done).length
  const overdue = 0

  return (
    <div className="task-board">
      
      <div className="header">
        <h1>Tasks</h1>
        <div className="stats">
          <span className="stat">Total: {total}</span>
          <span className="stat">Completed: {done}</span>
          <span className="stat">Overdue: {overdue}</span>
        </div>
      </div>

      <div className="task-table">

        <div className="add-form">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="New task title..." onKeyDown={e => e.key === 'Enter' && add()} />
          <select value={prio} onChange={e => setPrio(e.target.value as Task['priority'])}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="btn" onClick={add}>Add</button>
        </div>

        <div className="bar">
          <input placeholder="Search..." />
          <select value={filter} onChange={e => setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="todo">To Do</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="task-list">
          {visible.length === 0 && <div className="empty">No tasks yet</div>}
          {visible.map(t => (
            <div key={t.id} className={`task ${t.done ? 'done' : ''}`}>
              <input type="checkbox" className="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <div className="title">
                {t.title}
                <div className="meta">{t.priority} priority</div>
              </div>
              <span className={`prio ${t.priority}`}>{t.priority}</span>
              <button className="btn btn-outline" onClick={() => remove(t.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
