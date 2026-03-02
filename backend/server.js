import cors from 'cors'
import express from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const TODOS_FILE = path.join(DATA_DIR, 'todos.json')
const PORT = Number(process.env.PORT) || 3001

const app = express()
let mutationQueue = Promise.resolve()

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const ensureTodoFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(TODOS_FILE)
  } catch {
    await fs.writeFile(TODOS_FILE, '[]\n', 'utf8')
  }
}

const readTodos = async () => {
  await ensureTodoFile()
  const raw = await fs.readFile(TODOS_FILE, 'utf8')

  if (!raw.trim()) {
    return []
  }

  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

const writeTodos = async (todos) => {
  await fs.writeFile(TODOS_FILE, `${JSON.stringify(todos, null, 2)}\n`, 'utf8')
}

const queueMutation = async (handler) => {
  mutationQueue = mutationQueue.catch(() => undefined).then(async () => {
    const todos = await readTodos()
    const result = await handler(todos)

    if (!result || !Array.isArray(result.todos)) {
      throw new Error('Invalid todo mutation result.')
    }

    await writeTodos(result.todos)
    return result.data
  })

  return mutationQueue
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/todos', async (req, res, next) => {
  try {
    res.json(await readTodos())
  } catch (error) {
    next(error)
  }
})

app.post('/api/todos', async (req, res, next) => {
  try {
    const title =
      typeof req.body?.title === 'string' ? req.body.title.trim() : ''

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' })
    }

    const todo = {
      id: createId(),
      title,
      completed: false,
    }

    const createdTodo = await queueMutation((todos) => ({
      todos: [todo, ...todos],
      data: todo,
    }))

    res.status(201).json(createdTodo)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/todos/completed', async (req, res, next) => {
  try {
    const remainingTodos = await queueMutation((todos) => {
      const nextTodos = todos.filter((todo) => !todo.completed)

      return {
        todos: nextTodos,
        data: nextTodos,
      }
    })

    res.json(remainingTodos)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/todos/:id', async (req, res, next) => {
  try {
    const title =
      typeof req.body?.title === 'string' ? req.body.title.trim() : undefined
    const completed =
      typeof req.body?.completed === 'boolean'
        ? req.body.completed
        : undefined

    if (title === '' || (title === undefined && completed === undefined)) {
      return res.status(400).json({ error: 'Provide a valid todo update.' })
    }

    const updatedTodo = await queueMutation((todos) => {
      const index = todos.findIndex((todo) => todo.id === req.params.id)

      if (index === -1) {
        const error = new Error('Todo not found.')
        error.status = 404
        throw error
      }

      const currentTodo = todos[index]
      const nextTodo = {
        ...currentTodo,
        ...(title !== undefined ? { title } : {}),
        ...(completed !== undefined ? { completed } : {}),
      }
      const nextTodos = [...todos]
      nextTodos[index] = nextTodo

      return {
        todos: nextTodos,
        data: nextTodo,
      }
    })

    res.json(updatedTodo)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    await queueMutation((todos) => {
      const exists = todos.some((todo) => todo.id === req.params.id)

      if (!exists) {
        const error = new Error('Todo not found.')
        error.status = 404
        throw error
      }

      return {
        todos: todos.filter((todo) => todo.id !== req.params.id),
        data: null,
      }
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.use((error, req, res, next) => {
  void next

  const status = error.status || 500
  const message =
    status >= 500 ? 'Internal server error.' : error.message || 'Request failed.'

  console.error(error)
  res.status(status).json({ error: message })
})

ensureTodoFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Todo API running at http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
