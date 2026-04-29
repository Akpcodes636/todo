import { v4 as uuid } from 'uuid'
import { api, createLocalAdapter } from '../../lib/api'
import type { Project, Todo, WorkspaceData } from '../../types/todo'
import { sortProjects, sortTodos } from '../../utils/todo'

const STORAGE_KEY = 'studio.todo.workspace'
const RESPONSE_DELAY_MS = 250

const now = new Date()

const seedProjects: Project[] = [
  {
    id: uuid(),
    name: 'Product launch',
    description: 'External launch prep and final approvals.',
    color: '#f97316',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    order: 0,
  },
  {
    id: uuid(),
    name: 'Hiring loop',
    description: 'Candidate review, interviews, and follow-ups.',
    color: '#0ea5e9',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 40).toISOString(),
    order: 1,
  },
  {
    id: uuid(),
    name: 'Ops backlog',
    description: 'Internal fixes and recurring cleanup work.',
    color: '#10b981',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    order: 2,
  },
]

const seedTodos: Todo[] = [
  {
    id: uuid(),
    projectId: seedProjects[0].id,
    title: 'Finalize launch checklist with marketing',
    completed: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    order: 0,
  },
  {
    id: uuid(),
    projectId: seedProjects[0].id,
    title: 'Confirm stakeholder sign-off on release notes',
    completed: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 16).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 55).toISOString(),
    order: 1,
  },
  {
    id: uuid(),
    projectId: seedProjects[1].id,
    title: 'Review interview scorecards from yesterday',
    completed: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    order: 0,
  },
  {
    id: uuid(),
    projectId: seedProjects[2].id,
    title: 'Clean up duplicate bug reports in triage',
    completed: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 22).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
    order: 0,
  },
]

function wait() {
  return new Promise((resolve) => {
    setTimeout(resolve, RESPONSE_DELAY_MS)
  })
}

function sortWorkspace(workspace: WorkspaceData): WorkspaceData {
  return {
    projects: sortProjects(workspace.projects),
    todos: sortTodos(workspace.todos),
  }
}

function createSeedWorkspace(): WorkspaceData {
  return {
    projects: seedProjects,
    todos: seedTodos,
  }
}

function readWorkspace() {
  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    const seeded = createSeedWorkspace()
    writeWorkspace(seeded)
    return seeded
  }

  try {
    return sortWorkspace(JSON.parse(stored) as WorkspaceData)
  } catch {
    const seeded = createSeedWorkspace()
    writeWorkspace(seeded)
    return seeded
  }
}

function writeWorkspace(workspace: WorkspaceData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortWorkspace(workspace)))
}

function nextProjectOrder(projects: Project[]) {
  return projects.length === 0
    ? 0
    : Math.max(...projects.map((project) => project.order)) + 1
}

function nextTodoOrder(todos: Todo[], projectId: string) {
  const projectTodos = todos.filter((todo) => todo.projectId === projectId)

  return projectTodos.length === 0
    ? 0
    : Math.max(...projectTodos.map((todo) => todo.order)) + 1
}

function reindexTodosForProject(todos: Todo[], projectId: string) {
  const targeted = sortTodos(todos.filter((todo) => todo.projectId === projectId)).map(
    (todo, index) => ({
      ...todo,
      order: index,
    }),
  )
  const untouched = todos.filter((todo) => todo.projectId !== projectId)

  return [...untouched, ...targeted]
}

export const todoService = {
  async getWorkspace() {
    const response = await api.get<WorkspaceData>('/workspace', {
      adapter: createLocalAdapter(async () => {
        await wait()
        return readWorkspace()
      }),
    })

    return response.data
  },

  async createProject({
    description,
    name,
  }: {
    name: string
    description?: string
  }) {
    const response = await api.post<Project>(
      '/projects',
      { description, name },
      {
        adapter: createLocalAdapter(async () => {
          await wait()

          const workspace = readWorkspace()
          const timestamp = new Date().toISOString()
          const project: Project = {
            id: uuid(),
            name: name.trim(),
            description: description?.trim() || 'New project workspace.',
            color: ['#f97316', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444'][
              workspace.projects.length % 5
            ],
            createdAt: timestamp,
            updatedAt: timestamp,
            order: nextProjectOrder(workspace.projects),
          }

          writeWorkspace({
            ...workspace,
            projects: [...workspace.projects, project],
          })

          return project
        }, 201),
      },
    )

    return response.data
  },

  async deleteProject(projectId: string) {
    const response = await api.delete<{ projectId: string; removedTodoIds: string[] }>(
      `/projects/${projectId}`,
      {
        adapter: createLocalAdapter(async () => {
          await wait()

          const workspace = readWorkspace()
          const removedTodoIds = workspace.todos
            .filter((todo) => todo.projectId === projectId)
            .map((todo) => todo.id)

          writeWorkspace({
            projects: workspace.projects
              .filter((project) => project.id !== projectId)
              .map((project, index) => ({ ...project, order: index })),
            todos: workspace.todos.filter((todo) => todo.projectId !== projectId),
          })

          return { projectId, removedTodoIds }
        }),
      },
    )

    return response.data
  },

  async createTodo({ projectId, title }: { projectId: string; title: string }) {
    const response = await api.post<Todo>(
      '/todos',
      { projectId, title },
      {
        adapter: createLocalAdapter(async () => {
          await wait()

          const workspace = readWorkspace()
          const timestamp = new Date().toISOString()
          const todo: Todo = {
            id: uuid(),
            projectId,
            title: title.trim(),
            completed: false,
            createdAt: timestamp,
            updatedAt: timestamp,
            order: nextTodoOrder(workspace.todos, projectId),
          }

          writeWorkspace({
            ...workspace,
            todos: [...workspace.todos, todo],
          })

          return todo
        }, 201),
      },
    )

    return response.data
  },

  async updateTodo(id: string, changes: Partial<Pick<Todo, 'completed' | 'title'>>) {
    const response = await api.patch<Todo>(
      `/todos/${id}`,
      changes,
      {
        adapter: createLocalAdapter(async () => {
          await wait()

          const workspace = readWorkspace()
          const todo = workspace.todos.find((item) => item.id === id)

          if (!todo) {
            throw new Error('Todo not found')
          }

          const updated: Todo = {
            ...todo,
            ...changes,
            updatedAt: new Date().toISOString(),
          }

          writeWorkspace({
            ...workspace,
            todos: workspace.todos.map((item) => (item.id === id ? updated : item)),
          })

          return updated
        }),
      },
    )

    return response.data
  },

  async deleteTodo(id: string) {
    const response = await api.delete<{ id: string; projectId: string }>(`/todos/${id}`, {
      adapter: createLocalAdapter(async () => {
        await wait()
        const workspace = readWorkspace()
        const todo = workspace.todos.find((item) => item.id === id)

        if (!todo) {
          throw new Error('Todo not found')
        }

        writeWorkspace({
          ...workspace,
          todos: reindexTodosForProject(
            workspace.todos.filter((item) => item.id !== id),
            todo.projectId,
          ),
        })

        return { id, projectId: todo.projectId }
      }),
    })

    return response.data
  },

  async clearCompleted(projectId: string) {
    const response = await api.delete<{ projectId: string; removedIds: string[] }>(
      `/projects/${projectId}/todos/completed`,
      {
        adapter: createLocalAdapter(async () => {
          await wait()
          const workspace = readWorkspace()
          const removedIds = workspace.todos
            .filter((todo) => todo.projectId === projectId && todo.completed)
            .map((todo) => todo.id)

          writeWorkspace({
            ...workspace,
            todos: reindexTodosForProject(
              workspace.todos.filter((todo) => !removedIds.includes(todo.id)),
              projectId,
            ),
          })

          return { projectId, removedIds }
        }),
      },
    )

    return response.data
  },

  async reorderTodos({ ids, projectId }: { projectId: string; ids: string[] }) {
    const response = await api.post<Todo[]>(
      `/projects/${projectId}/todos/reorder`,
      { ids, projectId },
      {
        adapter: createLocalAdapter(async () => {
          await wait()
          const workspace = readWorkspace()
          const projectTodos = workspace.todos.filter((todo) => todo.projectId === projectId)
          const otherTodos = workspace.todos.filter((todo) => todo.projectId !== projectId)
          const byId = new Map(projectTodos.map((todo) => [todo.id, todo]))

          const reordered = ids
            .map((id, index) => {
              const todo = byId.get(id)
              if (!todo) {
                return null
              }

              return {
                ...todo,
                order: index,
                updatedAt: new Date().toISOString(),
              }
            })
            .filter((todo): todo is Todo => Boolean(todo))

          writeWorkspace({
            ...workspace,
            todos: [...otherTodos, ...reordered],
          })

          return reordered
        }),
      },
    )

    return response.data
  },
}
