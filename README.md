# Todo App

This repository is split into two separate packages: the **frontend** (React + Vite) and the **backend** (Express API).

- `frontend/` contains the React application built with Vite. It communicates with the API via `/api` endpoints.
- `backend/` hosts an Express server that persists todo list data to a JSON file located at `backend/data/todos.json`.

## Running the project

After installing dependencies at the root (which uses npm workspaces to install both sides), you can:

1. **Start both services together**
   ```bash
   npm run dev
   ```
   This will run the backend on port 3001 and the frontend on port 5173 (default). The Vite dev server proxies `/api` requests to the backend.

2. **Run only the frontend**
   ```bash
   npm run client
   ```

3. **Run only the backend**
   ```bash
   npm run server
   ```

4. **Build the frontend**
   ```bash
   npm run build
   ```

5. **Preview the production build**
   ```bash
   npm run preview
   ```

### Backend details

The backend uses a simple file-based storage. All todos are read from and written to `backend/data/todos.json`. If the file does not exist it will be created automatically.

### ESLint

Linting is configured at the root and applies to both packages; run `npm run lint` from the root or from a workspace directory.

---

You can still use this as a starting template for a React + Vite application, but the code is already wired up to demonstrate a separate API layer that persists to JSON.
