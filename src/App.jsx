import { useEffect, useMemo, useState } from 'react'
import './App.css'

const FILTERS = ['all', 'active', 'completed']
const STORAGE_KEY = 'react-todo-list'
const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const createTodo = (title) => ({
  id: createId(),
  title,
  completed: false,
})

function App() {
  const [todos, setTodos] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [newTodo, setNewTodo] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  )

  const completedCount = todos.length - remainingCount

  const filteredTodos = useMemo(() => {
    if (filter === 'active') {
      return todos.filter((todo) => !todo.completed)
    }

    if (filter === 'completed') {
      return todos.filter((todo) => todo.completed)
    }

    return todos
  }, [filter, todos])

  const handleSubmit = (event) => {
    event.preventDefault()
    const title = newTodo.trim()

    if (!title) {
      return
    }

    setTodos((current) => [createTodo(title), ...current])
    setNewTodo('')
  }

  const handleToggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  const handleDeleteTodo = (id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  const handleClearCompleted = () => {
    setTodos((current) => current.filter((todo) => !todo.completed))
  }

  return (
    <main className="todo-shell">
      <section className="todo-card">
        <header className="todo-header">
          <p className="kicker">React Productivity</p>
          <h1>Todo Board</h1>
          <p className="subtitle">Capture tasks, keep focus, finish clean.</p>
        </header>

        <form className="todo-form" onSubmit={handleSubmit}>
          <label htmlFor="new-todo" className="sr-only">
            Add a new todo
          </label>
          <input
            id="new-todo"
            type="text"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Write a task..."
            autoComplete="off"
          />
          <button type="submit">Add</button>
        </form>

        <div className="todo-toolbar">
          <div className="filters" role="tablist" aria-label="Todo filters">
            {FILTERS.map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                role="tab"
                aria-selected={filter === filterOption}
                className={filter === filterOption ? 'active' : ''}
                onClick={() => setFilter(filterOption)}
              >
                {filterOption}
              </button>
            ))}
          </div>
          <p className="stats">
            {remainingCount} left | {completedCount} done
          </p>
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <li className="empty-state">
              {todos.length === 0
                ? 'No tasks yet. Add your first one.'
                : 'No tasks in this filter.'}
            </li>
          ) : (
            filteredTodos.map((todo) => (
              <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                  />
                  <span>{todo.title}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>

        <footer className="todo-footer">
          <p>Total tasks: {todos.length}</p>
          <button
            type="button"
            onClick={handleClearCompleted}
            disabled={completedCount === 0}
          >
            Clear completed
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
