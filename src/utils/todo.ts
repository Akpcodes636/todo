import type {
  Project,
  ProjectInsight,
  Todo,
  TodoStatusFilter,
  TodoSummary,
  WorkspaceSummary,
} from '../types/todo'

export function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => left.order - right.order)
}

export function sortTodos(todos: Todo[]) {
  return [...todos].sort((left, right) => left.order - right.order)
}

export function filterTodos(todos: Todo[], filter: TodoStatusFilter) {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed)
    case 'completed':
      return todos.filter((todo) => todo.completed)
    default:
      return todos
  }
}

export function getProjectTodos(todos: Todo[], projectId: string | null) {
  if (!projectId) {
    return []
  }

  return sortTodos(todos.filter((todo) => todo.projectId === projectId))
}

export function summarizeTodos(todos: Todo[]): TodoSummary {
  const completed = todos.filter((todo) => todo.completed).length
  const total = todos.length
  const active = total - completed

  return {
    active,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    total,
  }
}

export function summarizeWorkspace(
  projects: Project[],
  todos: Todo[],
): WorkspaceSummary {
  const todoSummary = summarizeTodos(todos)
  const emptyProjectCount = projects.filter(
    (project) => getProjectTodos(todos, project.id).length === 0,
  ).length

  return {
    ...todoSummary,
    emptyProjectCount,
    projectCount: projects.length,
  }
}

export function buildProjectInsights(
  projects: Project[],
  todos: Todo[],
): ProjectInsight[] {
  return sortProjects(projects).map((project) => {
    const summary = summarizeTodos(getProjectTodos(todos, project.id))

    return {
      ...summary,
      color: project.color,
      projectId: project.id,
      projectName: project.name,
    }
  })
}

export function getProjectById(projects: Project[], projectId: string | null) {
  if (!projectId) {
    return null
  }

  return projects.find((project) => project.id === projectId) ?? null
}
