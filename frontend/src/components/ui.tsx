import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconType } from 'react-icons'

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

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'chip'

export function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}) {
  return <button type={type} className={cx(`btn-${variant}`, className)} {...props} />
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
    <section className={cx('auto-card p-card', className)}>
      <div className="page-header">
        <div className="page-header-content">
          {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
          <h2 className="page-title">{title}</h2>
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
    <section className={cx('auto-card p-card', className)}>
      {title || description || eyebrow || actions ? (
        <div className="page-header">
          <div className="page-header-content">
            {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="text-h2 text-text-primary">{title}</h2> : null}
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
  tone,
}: {
  icon?: IconType
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
  tone?: string
}) {
  void tone

  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {meta ? <p className="metric-meta">{meta}</p> : null}
        </div>
        {Icon ? (
          <div className="metric-icon">
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
    <div className={cx('rounded-lg border border-dashed border-border bg-surface-2 p-8 text-center sm:p-12', className)}>
      {Icon ? <Icon className="mx-auto text-display text-text-muted" /> : null}
      <h3 className="mt-6 text-h2 text-text-primary">{title}</h3>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-body text-text-secondary">{description}</p>
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
  return <div className={cx('glass-panel p-card', className)}>{children}</div>
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
    <div className={cx('flex items-center justify-between gap-4 text-body', className)}>
      <span className="text-text-secondary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
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
    <div className="inline-flex flex-wrap gap-2 rounded-md border border-border bg-surface-2 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            'rounded-sm px-4 py-2 text-body transition-colors',
            option.value === value
              ? 'bg-surface-3 text-text-primary'
              : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('glass-panel p-card', className)}>{children}</div>
}

export function SectionGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx('grid gap-3 md:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
}

export function Badge({
  children,
  tone = 'auto-badge',
}: {
  children: ReactNode
  tone?: string
}) {
  return <span className={cx('btn-chip', tone)}>{children}</span>
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
      <div className="overflow-hidden rounded-md border border-border bg-surface-2">
        <div className="overflow-x-auto">{children}</div>
      </div>
    </Section>
  )
}
