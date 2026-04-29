import { create } from 'zustand'
import type { TodoStatusFilter } from '../../types/todo'

export type DashboardView = 'overview' | 'projects' | 'tasks' | 'analytics'

interface TodoUiState {
  filter: TodoStatusFilter
  selectedProjectId: string | null
  view: DashboardView
  setFilter: (filter: TodoStatusFilter) => void
  setSelectedProjectId: (projectId: string | null) => void
  setView: (view: DashboardView) => void
}

export const useTodoStore = create<TodoUiState>((set) => ({
  filter: 'all',
  selectedProjectId: null,
  view: 'overview',
  setFilter: (filter) => set({ filter }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setView: (view) => set({ view }),
}))
