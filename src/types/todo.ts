export type TodoStatusFilter = 'all' | 'active' | 'completed'

export interface Project {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
  order: number
}

export interface Todo {
  id: string
  projectId: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
  order: number
}

export interface WorkspaceData {
  projects: Project[]
  todos: Todo[]
}

export interface TodoSummary {
  total: number
  active: number
  completed: number
  completionRate: number
}

export interface WorkspaceSummary extends TodoSummary {
  projectCount: number
  emptyProjectCount: number
}

export interface ProjectInsight extends TodoSummary {
  projectId: string
  projectName: string
  color: string
}
