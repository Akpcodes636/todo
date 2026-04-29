import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

type PanelProps = ComponentPropsWithoutRef<'section'>

export function Panel({ className, ...props }: PanelProps) {
  return (
    <section
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
