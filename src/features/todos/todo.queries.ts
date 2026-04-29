import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Todo, WorkspaceData } from '../../types/todo'
import { sortProjects, sortTodos } from '../../utils/todo'
import { todoService } from './todo.service'

export const todoKeys = {
  workspace: ['workspace'] as const,
}

function updateWorkspaceCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (current: WorkspaceData) => WorkspaceData,
) {
  queryClient.setQueryData<WorkspaceData>(todoKeys.workspace, (current) => {
    const safeCurrent: WorkspaceData = current ?? { projects: [], todos: [] }
    return updater(safeCurrent)
  })
}

export function useWorkspaceQuery() {
  return useQuery({
    queryFn: todoService.getWorkspace,
    queryKey: todoKeys.workspace,
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: todoService.createProject,
    onSuccess: (project) => {
      updateWorkspaceCache(queryClient, (current) => ({
        ...current,
        projects: sortProjects([...current.projects, project]),
      }))
      toast.success('Project added')
    },
    onError: () => {
      toast.error('We could not create that project')
    },
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: todoService.deleteProject,
    onSuccess: ({ projectId }) => {
      updateWorkspaceCache(queryClient, (current) => ({
        projects: current.projects
          .filter((project) => project.id !== projectId)
          .map((project, index) => ({ ...project, order: index })),
        todos: current.todos.filter((todo) => todo.projectId !== projectId),
      }))
      toast.success('Project deleted')
    },
    onError: () => {
      toast.error('That project could not be deleted')
    },
  })
}

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: todoService.createTodo,
    onSuccess: (createdTodo) => {
      updateWorkspaceCache(queryClient, (current) => ({
        ...current,
        todos: sortTodos([...current.todos, createdTodo]),
      }))
      toast.success('Todo added')
    },
    onError: () => {
      toast.error('We could not add that todo')
    },
  })
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: string
      changes: Partial<Pick<Todo, 'completed' | 'title'>>
    }) => todoService.updateTodo(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.workspace })
      const previousWorkspace =
        queryClient.getQueryData<WorkspaceData>(todoKeys.workspace) ?? {
          projects: [],
          todos: [],
        }

      updateWorkspaceCache(queryClient, (current) => ({
        ...current,
        todos: current.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                ...changes,
                updatedAt: new Date().toISOString(),
              }
            : todo,
        ),
      }))

      return { previousWorkspace }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(todoKeys.workspace, context.previousWorkspace)
      }
      toast.error('That update did not stick')
    },
  })
}

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: todoService.deleteTodo,
    onSuccess: ({ id, projectId }) => {
      updateWorkspaceCache(queryClient, (current) => {
        const remainingTodos = current.todos.filter((todo) => todo.id !== id)
        const projectTodos = remainingTodos
          .filter((todo) => todo.projectId === projectId)
          .sort((left, right) => left.order - right.order)
          .map((todo, index) => ({ ...todo, order: index }))
        const otherTodos = remainingTodos.filter((todo) => todo.projectId !== projectId)

        return {
          ...current,
          todos: [...otherTodos, ...projectTodos],
        }
      })

      toast.success('Todo removed')
    },
    onError: () => {
      toast.error('We could not delete that todo')
    },
  })
}

export function useClearCompletedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: todoService.clearCompleted,
    onSuccess: ({ projectId, removedIds }) => {
      updateWorkspaceCache(queryClient, (current) => {
        const remainingTodos = current.todos.filter(
          (todo) => !removedIds.includes(todo.id),
        )
        const projectTodos = remainingTodos
          .filter((todo) => todo.projectId === projectId)
          .sort((left, right) => left.order - right.order)
          .map((todo, index) => ({ ...todo, order: index }))
        const otherTodos = remainingTodos.filter((todo) => todo.projectId !== projectId)

        return {
          ...current,
          todos: [...otherTodos, ...projectTodos],
        }
      })
      toast.success('Completed todos cleared')
    },
    onError: () => {
      toast.error('Completed todos could not be cleared')
    },
  })
}

export function useReorderTodosMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: todoService.reorderTodos,
    onMutate: async ({ ids, projectId }: { projectId: string; ids: string[] }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.workspace })
      const previousWorkspace =
        queryClient.getQueryData<WorkspaceData>(todoKeys.workspace) ?? {
          projects: [],
          todos: [],
        }

      updateWorkspaceCache(queryClient, (current) => {
        const projectTodosById = new Map(
          current.todos
            .filter((todo) => todo.projectId === projectId)
            .map((todo) => [todo.id, todo]),
        )
        const reordered = ids
          .map((id, index) => {
            const todo = projectTodosById.get(id)
            return todo ? { ...todo, order: index } : null
          })
          .filter((todo): todo is Todo => Boolean(todo))
        const otherTodos = current.todos.filter((todo) => todo.projectId !== projectId)

        return {
          ...current,
          todos: [...otherTodos, ...reordered],
        }
      })

      return { previousWorkspace }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(todoKeys.workspace, context.previousWorkspace)
      }
      toast.error('Reordering failed')
    },
  })
}
