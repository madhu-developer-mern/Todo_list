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

  // Dummy logging function
  const logTodoAction = (action, data = null) => {
    const log = {
      action,
      data,
      timestamp: new Date().toISOString(),
    }

    console.log('TODO APP LOG:', log)
  }

  useEffect(() => {
    let ignore = false

    const loadTodos = async () => {
      try {
        logTodoAction('FETCH_TODOS_STARTED')

        const items = await fetchTodos()

        if (!ignore) {
          setTodos(items)
          setError('')

          logTodoAction('FETCH_TODOS_SUCCESS', {
            count: items.length,
          })
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message)

          logTodoAction('FETCH_TODOS_FAILED', {
            error: loadError.message,
          })
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

      logTodoAction('API_REQUEST_FAILED', {
        error: requestError.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const title = newTodo.trim()

    if (!title) {
      logTodoAction('EMPTY_TODO_SUBMIT_ATTEMPT')
      return
    }

    await runMutation(async () => {
      logTodoAction('CREATE_TODO_STARTED', {
        title,
      })

      const createdTodo = await createTodo(title)

      setTodos((current) => [createdTodo, ...current])
      setNewTodo('')

      logTodoAction('CREATE_TODO_SUCCESS', createdTodo)
    })
  }

  const handleToggleTodo = async (todo) => {
    await runMutation(async () => {
      logTodoAction('TOGGLE_TODO_STARTED', {
        id: todo.id,
        currentStatus: todo.completed,
      })

      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      })

      setTodos((current) =>
        current.map((item) =>
          item.id === todo.id ? updatedTodo : item,
        ),
      )

      logTodoAction('TOGGLE_TODO_SUCCESS', updatedTodo)
    })
  }

  const handleDeleteTodo = async (id) => {
    await runMutation(async () => {
      logTodoAction('DELETE_TODO_STARTED', {
        id,
      })

      await deleteTodo(id)

      setTodos((current) =>
        current.filter((todo) => todo.id !== id),
      )

      logTodoAction('DELETE_TODO_SUCCESS', {
        id,
      })
    })
  }

  const handleClearCompleted = async () => {
    await runMutation(async () => {
      logTodoAction('CLEAR_COMPLETED_STARTED', {
        completedCount,
      })

      const remainingTodos = await clearCompletedTodos()

      setTodos(remainingTodos)

      logTodoAction('CLEAR_COMPLETED_SUCCESS', {
        remainingCount: remainingTodos.length,
      })
    })
  }

  const handleFilterChange = (filterOption) => {
    setFilter(filterOption)

    logTodoAction('FILTER_CHANGED', {
      filter: filterOption,
    })
  }

  return (
    <main className="todo-shell">
      <section className="todo-card">
        <header className="todo-header">
          <p className="kicker">React Productivity</p>

          <h1>Todo Board</h1>

          <p className="subtitle">
            Simple React UI backed by a local JSON API.
          </p>
        </header>

        <form
          className="todo-form"
          onSubmit={handleSubmit}
        >
          <label
            htmlFor="new-todo"
            className="sr-only"
          >
            Add a new todo
          </label>

          <input
            id="new-todo"
            type="text"
            value={newTodo}
            onChange={(event) =>
              setNewTodo(event.target.value)
            }
            placeholder="Write a task..."
            autoComplete="off"
            disabled={isBusy}
          />

          <button
            type="submit"
            disabled={isBusy}
          >
            {saving ? 'Saving...' : 'Add'}
          </button>
        </form>

        {error ? (
          <p className="status-banner error">
            {error}
          </p>
        ) : null}

        <p className="status-banner info">
          Stored in `data/todos.json` through the backend API.
        </p>

        <div className="todo-toolbar">
          <div
            className="filters"
            role="tablist"
            aria-label="Todo filters"
          >
            {FILTERS.map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                role="tab"
                aria-selected={
                  filter === filterOption
                }
                className={
                  filter === filterOption
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleFilterChange(filterOption)
                }
              >
                {filterOption}
              </button>
            ))}
          </div>

          <p className="stats">
            {remainingCount} left dshb | {completedCount} done
          </p>
        </div>

        <ul className="todo-list">
          {loading ? (
            <li className="empty-state">
              Loading todos from backend...
            </li>
          ) : filteredTodos.length === 0 ? (
            <li className="empty-state">
              {todos.length === 0
                ? 'No tasks yet. Add your first one.'
                : 'No tasks in this filter.'}
            </li>
          ) : (
            filteredTodos.map((todo) => (
              <li
                key={todo.id}
                className={
                  todo.completed
                    ? 'completed'
                    : ''
                }
              >
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() =>
                      handleToggleTodo(todo)
                    }
                    disabled={isBusy}
                  />

                  <span>{todo.title}</span>
                </label>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    handleDeleteTodo(todo.id)
                  }
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
            disabled={
              isBusy || completedCount === 0
            }
          >
            Clear completed
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App