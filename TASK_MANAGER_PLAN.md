# Task Manager — Project Plan

## 1. Overview

A small, simple task manager web app for personal use. Core purpose: create, organize, and track tasks from an easy interface. Single-user (no auth required for v1), fast to build, easy to extend later.

---

## 2. Goals & Non-Goals

### Goals
- Create, read, update, delete (CRUD) tasks
- Organize tasks with status, priority, due date, and optional category/tag
- Filter, search, and sort task lists
- Persist data locally and across page reloads
- Work well on desktop and mobile browsers

### Non-Goals (v1)
- Multi-user accounts / authentication
- Real-time collaboration
- Notifications / email reminders
- Native mobile apps
- Complex permissions or teams

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | User can create a task with title, optional description, priority, due date, and status |
| FR-2 | User can edit any field of an existing task |
| FR-3 | User can delete a task, with a confirmation prompt |
| FR-4 | User can mark a task complete / reopen a completed task |
| FR-5 | User can view tasks grouped or filtered by status (All / To Do / In Progress / Done) |
| FR-6 | User can filter by priority and/or category |
| FR-7 | User can search tasks by title or description text |
| FR-8 | User can sort tasks by due date, priority, or creation date |
| FR-9 | User can assign an optional category/tag created on the fly |
| FR-10 | Data persists between sessions (localStorage for v1) |
| FR-11 | Completed tasks can be cleared in bulk ("Clear completed") |
| FR-12 | Dashboard shows counts: total, completed, overdue |

### 3.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Page loads and is interactive in under 2 seconds on a typical connection |
| NFR-2 | Fully usable on viewports from 320px to 1440px wide |
| NFR-3 | Accessible: keyboard navigable, semantic HTML, ARIA labels, visible focus states |
| NFR-4 | Data survives accidental refresh (persistence layer) |
| NFR-5 | No manual steps to run: `npm install && npm run dev` |
| NFR-6 | Codebase is small enough for one person to maintain (target under ~2,000 lines) |

### 3.3 Data Model

```
Task {
  id: string          // uuid
  title: string        // required, 1-200 chars
  description: string  // optional, free text
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null   // ISO date (YYYY-MM-DD)
  category: string | null  // free-form tag
  createdAt: string   // ISO timestamp
  updatedAt: string    // ISO timestamp
}
```

---

## 4. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Build tool | Vite | Fast dev server, zero config for small apps |
| Language | TypeScript | Type safety, better maintainability |
| UI Framework | React 18 | Component model, huge ecosystem |
| Styling | Tailwind CSS | Utility-first, no CSS architecture overhead, fast responsive work |
| Component primitives | Headless UI (or Radix) | Accessible dialogs, dropdowns, focus management out of the box |
| State management | React Context + useReducer, or Zustand | Small app, no need for Redux |
| Persistence | Browser `localStorage` (v1), abstracted behind a repository | Zero backend, easy swap to an API later |
| Date utilities | `date-fns` | Small, tree-shakeable |
| Icons | `lucide-react` | Lightweight, consistent |
| Testing | Vitest + React Testing Library (unit/component), optional Playwright (E2E) | Matches Vite, minimal setup |
| Linting/Formatting | ESLint + Prettier + `eslint-plugin-react-hooks` | Consistent code style |
| Version control | Git + GitHub | Standard |

### Optional / Future
- **Backend:** Node.js + Express or Next.js API routes (when persistence beyond one browser is needed)
- **Database:** PostgreSQL or SQLite via Supabase (Changed it to Supabase from Primsa)
- **Deployment:** Vercel or Netlify (static hosting) for v1

---

## 5. Project Structure

```
task-manager/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css              # Tailwind directives
│   ├── types/
│   │   └── task.ts            # Task type + enums
│   ├── store/
│   │   ├── TaskContext.tsx    # Context + provider
│   │   ├── taskReducer.ts     # Reducer: add/update/delete/toggle/clear
│   │   └── selectors.ts       # filtering, sorting, stats
│   ├── lib/
│   │   ├── storage.ts         # localStorage repository (load/save)
│   │   ├── date.ts            # date helpers, overdue checks
│   │   └── id.ts              # uuid generation
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   └── useTaskFilters.ts
│   ├── components/
│   │   ├── TaskForm.tsx       # create/edit modal
│   │   ├── TaskItem.tsx       # single task row/card
│   │   ├── TaskList.tsx
│   │   ├── FilterBar.tsx      # status tabs, search, priority filter
│   │   ├── SortSelect.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── StatsBar.tsx       # counts / overdue badge
│   └── __tests__/
│       ├── taskReducer.test.ts
│       └── TaskList.test.tsx
└── README.md
```

---

## 6. Development Phases

### Phase 0 — Setup (½ day)
1. Initialize project: `npm create vite@latest task-manager -- --template react-ts`
2. Install deps: `tailwindcss postcss autoprefixer` (or `@tailwindcss/vite` plugin), `date-fns`, `lucide-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `prettier`, `eslint`
3. Configure Tailwind, Prettier, ESLint, path alias (`@/`)
4. Init git repo, create initial commit

### Phase 1 — Data Layer (½ day)
- Define `Task` type and status/priority unions
- Implement `taskReducer` with pure actions and unit tests
- Implement `storage.ts` with load/persist + schema validation
- Wrap in `TaskContext` provider with a `useTasks` hook

### Phase 2 — UI Skeleton (1 day)
- App layout: header, stats bar, filter bar, task list
- `TaskItem` displaying title, priority badge, due date, status, edit/delete buttons
- Empty state ("No tasks yet")

### Phase 3 — Task CRUD (1 day)
- `TaskForm` modal (create + edit modes) with validation
- Delete confirmation dialog
- Toggle complete / reopen
- "Clear completed" action

### Phase 4 — Filter, Search, Sort (½ day)
- Status tabs (All / To Do / In Progress / Done)
- Priority and category filters
- Text search input
- Sort by due date / priority / created date

### Phase 5 — Polish (½ day)
- Responsive layout for mobile
- Keyboard navigation and ARIA labels
- Overdue highlighting
- Loading/empty states
- Component tests + reducer tests

### Phase 6 — Deploy (½ day)
- Production build: `npm run build`
- Deploy static output to Vercel or Netlify
- README with setup and scripts

---

## 7. Tools Needed

| Category | Tool |
|----------|------|
| Runtime | Node.js 20+ LTS, npm |
| Editor | VS Code + ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript Vue plugin |
| Version control | Git, GitHub account |
| Browser | Chrome (with React/Vue DevTools extension) |
| Testing | Vitest, React Testing Library, jsdom |
| Deployment | Vercel or Netlify account (free tier) |
| Optional API dev | Postman/Thunder Client (for later backend work) |

---

## 8. Commands

```bash
npm create vite@latest task-manager -- --template react-ts
cd task-manager
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install date-fns lucide-react
npm install -D vitetest @testing-library/react @testing-library/jest-dom jsdom prettier eslint

npm run dev          # start dev server (http://localhost:5173)
npm run build        # production build to dist/
npm run preview      # preview production build
npm run test         # run unit tests
npm run lint         # run ESLint
npm run format       # run Prettier
```

---

## 9. Milestones & Estimates

| Milestone | Deliverable | Estimate |
|-----------|-------------|----------|
| M1 | Project scaffolded with tooling | ½ day |
| M2 | Reducer + storage working with tests | ½ day |
| M3 | Task list and task item UI | 1 day |
| M4 | Create/edit/delete/toggle flows | 1 day |
| M5 | Filter, search, sort working | ½ day |
| M6 | Responsive + accessible | ½ day |
| M7 | Test suite green + deployed | ½ day |

**Total: ~4.5 days**

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scope creep (auth, sync, teams) | Strictly follow the Non-Goals list for v1 |
| localStorage limits/data loss | Validate loaded data against schema; keep records small; export/import later |
| UI complexity of a modal form | Use Headless UI/Radix for accessible dialog primitives |
| Time constraints | Phases are ordered so a usable MVP ships after Phase 3 |

---

## 11. Future Enhancements (Post-v1)

1. Backend + database sync (Express + PostgreSQL, or Next.js)
2. User accounts and JWT auth
3. Subtasks and checklists
4. Recurring tasks
5. Reminders / due-date notifications
6. Calendar and board (Kanban) views
7. CSV export/import (Done)
8. PWA support for offline use
9. Dark mode (Done)
10. Task categories/tags (Done)
11. Task notes/descriptions (Done)
12. Undo/redo functionality (Done)
13. Keyboard shortcuts (Done)
14. Sort by due date (Done)
15. Toast notifications (Done)
16. Progress bar visualization (Done)
17. Enhanced priority color coding (Done)
18. Animations and transitions (Done)
19. Improved empty states (Done)
20. Data validation (duplicate prevention, date ranges) (Done)
21. Performance optimization (virtualization for 1000+ tasks) (Done)
22. JSON import/export (Done)
