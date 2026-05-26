import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
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
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  loading?: boolean
}) {
  return (
    <button
      type={type}
      className={cx(`btn-${variant}`, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-b-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
}

export function NextActionCard({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  meta,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  meta?: ReactNode
  className?: string
}) {
  return (
    <section className={cx('next-action-card', className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
          <h2 className="mt-2 text-h1 text-text-primary">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-body text-text-secondary">{description}</p> : null}
          {meta ? <div className="mt-4">{meta}</div> : null}
        </div>
        {(primaryAction || secondaryAction) ? (
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </section>
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

const toneValueColors: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
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
  tone?: 'success' | 'warning' | 'danger' | 'info'
}) {
  const valueColor = tone ? toneValueColors[tone] : 'text-text-primary'

  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="metric-label">{label}</p>
          <p className={cx('metric-value', valueColor)}>{value}</p>
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
    <div className={cx('empty-state', className)}>
      {Icon ? <Icon className="mx-auto text-display text-text-muted" /> : null}
      <h3 className="mt-6 text-h2 text-text-primary">{title}</h3>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-body text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function LoadingState({
  label = 'Загрузка...',
  className,
}: {
  label?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('loading-state', className)} role="status" aria-live="polite">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-b-info" />
      <p className="mt-3 text-body text-text-secondary">{label}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />
}

export function SkeletonCard({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx('auto-card p-card', className)} aria-hidden="true">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-5 w-5 shrink-0" />
      </div>
      <div className="space-y-2 rounded-md border border-border bg-surface-3 p-4">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cx('metric-card', className)} aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-5 w-5 shrink-0" />
      </div>
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
  return <span className={tone}>{children}</span>
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

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string
    error?: string
    hint?: string
  }
>(function Input({ label, error, hint, id, className, required, ...props }, ref) {
  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined)
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="section-label">
          {label}
          {required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cx('auto-input', error ? 'auto-input-error' : '', className)}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-caption text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label ? (
        <p className="section-label">
          {label}
          {required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="text-caption text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-caption text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-border', className)} />
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: {
  page: number          // 0-indexed
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (totalPages <= 1) return null

  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalItems)

  // Видимые страницы: всегда первая, последняя и ±1 от текущей
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i)
  const visible = pageNumbers.filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1
  )

  return (
    <div className={cx('glass-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-body text-text-secondary">
        <span className="font-medium text-text-primary">{from}–{to}</span>
        {' '}из {totalItems}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary h-8 w-8 p-0 disabled:opacity-40"
          aria-label="Предыдущая страница"
        >
          ‹
        </button>

        {visible.map((p, idx) => {
          const prevVisible = visible[idx - 1]
          const showEllipsis = prevVisible !== undefined && p - prevVisible > 1
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-1 text-text-muted text-sm">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={cx(
                  'h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-accent text-white'
                    : 'btn-secondary'
                )}
                aria-current={p === page ? 'page' : undefined}
              >
                {p + 1}
              </button>
            </span>
          )
        })}

        <button
          type="button"
          disabled={page === totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary h-8 w-8 p-0 disabled:opacity-40"
          aria-label="Следующая страница"
        >
          ›
        </button>
      </div>
    </div>
  )
}
