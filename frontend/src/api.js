const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed.')
  }

  return payload
}

export const fetchTodos = () => request('/api/todos')

export const createTodo = (title) =>
  request('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })

export const updateTodo = (id, updates) =>
  request(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

export const deleteTodo = (id) =>
  request(`/api/todos/${id}`, {
    method: 'DELETE',
  })

export const clearCompletedTodos = () =>
  request('/api/todos/completed', {
    method: 'DELETE',
  })
