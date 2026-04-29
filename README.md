# Studio Todo Board

A polished frontend-only todo application built from the PRD in `Todo_PRD.docx`. The app uses a mock API layer shaped around Axios, server-state management with React Query, UI state with Zustand, form handling with React Hook Form, notifications with Sonner, and drag-and-drop ordering with `@dnd-kit`.

## Highlights

- Add, complete, uncomplete, delete, filter, and clear completed todos
- Drag-and-drop reordering in the `All` view
- Lightweight analytics for total, active, completed, and completion rate
- Loading, error, and empty states
- Local persistence through `localStorage`
- Dockerized production build

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Axios 1.14.0
- Zustand
- TanStack React Query
- React Hook Form
- Sonner
- `@dnd-kit`
- `date-fns`, `clsx`, `uuid`

## Project Structure

```text
src/
  components/         Shared layout primitives
  features/todos/      Todo feature UI, service, queries, store
  lib/                 Axios client and React Query client
  pages/               Page composition
  types/               Shared TypeScript types
  utils/               Filtering and analytics helpers
```

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## Production Build

```bash
npm run build
npm run preview
```

## Docker

Build the image:

```bash
docker build -t studio-todo-board .
```

Run the container:

```bash
docker run --rm -p 8080:80 studio-todo-board
```

Then open `http://localhost:8080`.

## Notes

- The todo data is persisted in browser `localStorage` so the mock API behaves like a small frontend-only backend.
- Reordering is intentionally limited to the `All` filter so hidden tasks are never reordered incorrectly.
- Live deployment URL: pending deployment from your hosting provider of choice such as Vercel or Netlify.
