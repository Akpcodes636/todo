import { startTransition } from 'react'
import clsx from 'clsx'
import { useTodoStore } from '../todo.store'
import type { TodoStatusFilter } from '../../../types/todo'

interface TodoFiltersProps {
  activeCount: number
  completedCount: number
  onClearCompleted: () => void
  isClearing: boolean
  projectName: string | null
}

const filters: Array<{ label: string; value: TodoStatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
]

export function TodoFilters({
  activeCount,
  completedCount,
  isClearing,
  onClearCompleted,
  projectName,
}: TodoFiltersProps) {
  const filter = useTodoStore((state) => state.filter)
  const setFilter = useTodoStore((state) => state.setFilter)

  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-[0_16px_40px_rgba(39,24,71,0.09)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Current view
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {projectName ?? 'No project selected'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              startTransition(() => setFilter(item.value))
            }}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              filter === item.value
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center">
        <span>{activeCount} active tasks left</span>
        <button
          type="button"
          onClick={onClearCompleted}
          disabled={completedCount === 0 || isClearing || !projectName}
          className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isClearing ? 'Clearing...' : `Clear completed (${completedCount})`}
        </button>
      </div>
    </div>
  )
}
