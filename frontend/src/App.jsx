import { useEffect, useMemo, useState } from 'react'
import {
  clearCompletedTodos,
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
} from './api'
import './App.css'

const FILTERS = ['all', 'active', 'completed']

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadTodos = async () => {
      try {
        const items = await fetchTodos()

        if (!ignore) {
          setTodos(items)
          setError('')
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadTodos()

    return () => {
      ignore = true
    }
  }, [])

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  )
  const completedCount = todos.length - remainingCount
  const isBusy = loading || saving

  const filteredTodos = useMemo(() => {
    if (filter === 'active') {
      return todos.filter((todo) => !todo.completed)
    }

    if (filter === 'completed') {
      return todos.filter((todo) => todo.completed)
    }

    return todos
  }, [filter, todos])

  const runMutation = async (action) => {
    setSaving(true)
    setError('')

    try {
      await action()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const title = newTodo.trim()

    if (!title) {
      return
    }

    await runMutation(async () => {
      const createdTodo = await createTodo(title)
      setTodos((current) => [createdTodo, ...current])
      setNewTodo('')
    })
  }

  const handleToggleTodo = async (todo) => {
    await runMutation(async () => {
      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      })

      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? updatedTodo : item)),
      )
    })
  }

  const handleDeleteTodo = async (id) => {
    await runMutation(async () => {
      await deleteTodo(id)
      setTodos((current) => current.filter((todo) => todo.id !== id))
    })
  }

  const handleClearCompleted = async () => {
    await runMutation(async () => {
      const remainingTodos = await clearCompletedTodos()
      setTodos(remainingTodos)
    })
  }

  return (
    <main className="todo-shell">
      <section className="todo-card">
        <header className="todo-header">
          <p className="kicker">React Productivity</p>
          <h1>Todo Board</h1>
          <p className="subtitle">Simple React UI backed by a local JSON API.</p>
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
            disabled={isBusy}
          />
          <button type="submit" disabled={isBusy}>
            {saving ? 'Saving...' : 'Add'}
          </button>
        </form>

        {error ? <p className="status-banner error">{error}</p> : null}
        <p className="status-banner info">Stored in `data/todos.json` through the backend API.</p>

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
          {loading ? (
            <li className="empty-state">Loading todos from backend...</li>
          ) : filteredTodos.length === 0 ? (
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
                    onChange={() => handleToggleTodo(todo)}
                    disabled={isBusy}
                  />
                  <span>{todo.title}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteTodo(todo.id)}
                  disabled={isBusy}
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
            disabled={isBusy || completedCount === 0}
          >
            Clear completed
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
