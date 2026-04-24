import { ReactNode } from 'react'
import { IconType } from 'react-icons'

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('page-shell', className)}>{children}</div>
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-subtitle">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  )
}

export function HeroCard({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section className={cx('auto-card p-7 sm:p-8', className)}>
      <div className="page-header">
        <div className="page-header-content">
          {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
          <h2 className="page-title text-[2.35rem] sm:text-[2.7rem] xl:text-[3rem]">{title}</h2>
          {description ? <p className="page-subtitle">{description}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

export function Section({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('auto-card p-7 sm:p-8', className)}>
      {title || description || eyebrow || actions ? (
        <div className="page-header">
          <div className="page-header-content">
            {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="text-3xl font-bold text-white">{title}</h2> : null}
            {description ? <p className="page-subtitle">{description}</p> : null}
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cx(title || description || eyebrow || actions ? 'mt-8' : '')}>{children}</div>
    </section>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = 'text-[#ff9b82]',
}: {
  icon?: IconType
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
  tone?: string
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {meta ? <p className="metric-meta">{meta}</p> : null}
        </div>
        {Icon ? (
          <div className={cx('flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl', tone)}>
            <Icon />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconType
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('rounded-[28px] border border-dashed border-white/10 bg-white/5 p-10 text-center sm:p-12', className)}>
      {Icon ? <Icon className="mx-auto text-7xl text-orange-300/70" /> : null}
      <h3 className="mt-6 text-3xl font-bold text-white">{title}</h3>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx('glass-panel p-5', className)}>{children}</div>
}

export function KeyValue({
  label,
  value,
  className,
}: {
  label: ReactNode
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex items-center justify-between gap-4 text-sm', className)}>
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  )
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: ReactNode }>
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/5 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            option.value === value
              ? 'bg-white text-slate-900'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('glass-panel p-4 sm:p-5', className)}>{children}</div>
}

export function SectionGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx('grid gap-6 md:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
}

export function Badge({
  children,
  tone = 'auto-badge',
}: {
  children: ReactNode
  tone?: string
}) {
  return <span className={cx('auto-badge', tone)}>{children}</span>
}

export function TableShell({
  title,
  description,
  children,
}: {
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <Section title={title} description={description}>
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
        <div className="overflow-x-auto">{children}</div>
      </div>
    </Section>
  )
}
