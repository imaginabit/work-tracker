# AGENTS.md — Work Tracker

## Project Overview

React + Vite SPA with Express/SQLite backend. Tracks tasks, time entries, clients, and users.
Frontend runs on port 5173 (Vite), API on port 3001.

## Build Commands

```bash
npm run dev      # Start dev server (frontend + API must run separately)
npm run build    # Production build → dist/
npm run lint     # ESLint check
npm run preview  # Preview production build
```

**Single-file lint:**
```bash
npx eslint path/to/file.jsx
```

**Backend server test:** The backend is `server.js` (Express + SQLite). No test runner configured.

## Code Style

### General
- **Language:** JavaScript (no TypeScript)
- **Module system:** ESM (`import/export`)
- **React version:** 19.x with hooks
- **Styling:** Plain CSS with custom properties (CSS variables)

### File Organization
```
src/
  components/   # Reusable UI (Modal, TaskForm, TimeEntryForm)
  context/      # AppContext (global state + API calls)
  pages/        # Route-level components (SchedulePage, TasksPage, TaskDetailPage)
  utils/        # Pure helper functions (dateUtils.js)
  App.jsx       # Router + header
  main.jsx      # Entry point
  index.css     # Global styles + CSS variables
```

### Naming Conventions
- **Components:** PascalCase file + default export (`Modal.jsx`, `TaskForm.jsx`)
- **Utils/Helpers:** camelCase file + named exports (`dateUtils.js`, `formatDate`)
- **Context:** PascalCase file (`AppContext.jsx`)
- **State:** Use `useState`, `useCallback`, `useMemo` for performance
- **IDs:** String IDs generated via `Date.now().toString(36) + random`

### Import Order
1. External libraries (`react`, `react-router-dom`)
2. Internal components/utils/context
3. CSS imports

### Formatting
- 2-space indentation
- No semicolons (ESM style)
- Trailing commas in multi-line
- Prefer arrow functions for callbacks
- Destructure props where practical

### React Patterns
- **Context:** Use `useApp()` hook from `AppContext`; throw error if used outside provider
- **State updates:** Functional setState (`setTasks(prev => [...])`)
- **Side effects:** `useEffect` with dependency array; cleanup functions returned
- **Memoization:** `useMemo` for expensive computations (filters, sorts)
- **Async in handlers:** `async/await` in event handlers; try/catch with console.error fallback

### API Layer (server.js)
- RESTful endpoints at `/api/{resource}`
- `express.json()` middleware for parsing
- SQLite with `better-sqlite3` (synchronous API)
- Always return `{ ok: true }` on success or the created resource
- 404 for not found: `res.status(404).json({ error: 'Not found' })`

### Error Handling
- API errors: console.error + return error response
- React: try/catch in async functions, console.error on failure
- Never swallow errors silently

### ESLint Rules
- `no-unused-vars`: Error except `varsIgnorePattern: '^[A-Z_]'` (uppercase/SCREAMING_CASE allowed)
- React Hooks rules enabled
- React Refresh plugin enabled (no .jsx in component names)

### CSS Conventions
- CSS variables in `:root` (colors, spacing via `--space-*`)
- BEM-like class naming (`task-card`, `task-card-header`, `task-card-title`)
- Utility inline styles for one-off layouts (use sparingly)

## Important Patterns

### Adding a new dispatch action in AppContext
```js
const actionName = async (payload) => {
  const item = { id: generateId(), ...payload, createdAt: new Date().toISOString() };
  await fetch(`${API}/resource`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  setState(prev => [...prev, item]);
  return item;
};
```

### Adding a new API route in server.js
```js
app.post('/api/resource', (req, res) => {
  const { field1, field2 } = req.body;
  db.prepare(`INSERT INTO table (field1, field2, createdAt) VALUES (?, ?, ?)`)
    .run(field1, field2, new Date().toISOString());
  res.json(req.body);
});
```

## Language
- UI is in Spanish; keep all labels, messages, and dates in Spanish
- Date formatting: `es-ES` locale
