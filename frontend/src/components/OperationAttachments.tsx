import { FaCamera, FaExternalLinkAlt, FaFileAlt } from 'react-icons/fa'
import { resolveFileUrl } from '../utils/resolveFileUrl'
import { cx } from './ui'

export type OperationAttachment = {
  id?: number | string
  fileUrl: string
  description?: string | null
}

const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)(?:[?#].*)?$/i

function isImageAttachment(attachment: OperationAttachment) {
  return IMAGE_FILE_PATTERN.test(attachment.fileUrl) || IMAGE_FILE_PATTERN.test(attachment.description || '')
}

function getAttachmentLabel(attachment: OperationAttachment) {
  if (attachment.description?.trim()) {
    return attachment.description.trim()
  }

  const fileName = attachment.fileUrl.split('/').pop()?.split('?')[0]?.split('#')[0]
  if (!fileName) {
    return 'Файл'
  }

  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

export default function OperationAttachments({
  attachments,
  title = 'Фотографии и документы',
  compact = false,
  inline = false,
  showLabels = true,
  className,
}: {
  attachments?: OperationAttachment[] | null
  title?: string
  compact?: boolean
  inline?: boolean
  showLabels?: boolean
  className?: string
}) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const imageAttachments = attachments.filter(isImageAttachment)
  const documentAttachments = attachments.filter((attachment) => !isImageAttachment(attachment))
  const totalAttachmentsCount = attachments.length

  return (
    <div
      className={cx(
        compact ? 'mt-4' : 'mt-5',
        inline && 'rounded-[1.1rem] border border-white/10 bg-white/5 p-3.5',
        className
      )}
    >
      <h4 className={cx('flex items-center gap-2 font-semibold text-white', inline ? 'mb-2.5 text-sm' : 'mb-3')}>
        <FaCamera className="text-[#ff9b82]" />
        {title}
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400">
          {totalAttachmentsCount}
        </span>
      </h4>

      {imageAttachments.length > 0 && (
        <div className={cx('flex flex-wrap gap-3', compact && 'overflow-x-auto pb-1 pr-1', inline && 'gap-2')}>
          {imageAttachments.map((attachment, index) => {
            const imageUrl = resolveFileUrl(attachment.fileUrl)

            return (
              <a
                key={attachment.id ?? `${attachment.fileUrl}-${index}`}
                href={imageUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  'group block',
                  inline
                    ? 'w-[6.25rem] shrink-0'
                    : compact
                      ? 'w-[9.5rem] shrink-0 sm:w-[10.5rem]'
                      : 'w-[11.5rem] sm:w-[12.5rem] xl:w-[13.5rem]'
                )}
              >
                <div
                  className={cx(
                    'overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-950/70 transition-colors group-hover:border-[#ff9b82]/40',
                    inline ? 'h-20 rounded-[0.95rem]' : compact ? 'h-24 sm:h-28' : 'h-32 sm:h-36'
                  )}
                >
                  <img
                    src={imageUrl || undefined}
                    alt={getAttachmentLabel(attachment)}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                {showLabels && (
                  <div className={cx('mt-2 flex items-center justify-between gap-2', inline && 'mt-1.5')}>
                    <p className={cx('truncate text-[11px] text-slate-300', inline && 'max-w-[4.8rem] text-[10px]')}>
                      {getAttachmentLabel(attachment)}
                    </p>
                    <FaExternalLinkAlt className="shrink-0 text-[11px] text-slate-500 transition-colors group-hover:text-[#ff9b82]" />
                  </div>
                )}
              </a>
            )
          })}
        </div>
      )}

      {documentAttachments.length > 0 && (
        <div className={cx(imageAttachments.length > 0 ? (inline ? 'mt-2.5' : 'mt-4') : '', 'flex flex-wrap gap-2')}>
          {documentAttachments.map((attachment, index) => {
            const fileUrl = resolveFileUrl(attachment.fileUrl)

            return (
              <a
                key={attachment.id ?? `${attachment.fileUrl}-${index}`}
                href={fileUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  'inline-flex min-w-0 items-center gap-2 border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-[#ff9b82]/35 hover:bg-white/10',
                  inline ? 'rounded-xl px-2.5 py-2 text-xs' : 'rounded-2xl px-3 py-2 text-sm'
                )}
              >
                <FaFileAlt className="shrink-0 text-[#ff9b82]" />
                <span className={cx('truncate', inline ? 'max-w-[10rem]' : 'max-w-[15rem]')}>
                  {getAttachmentLabel(attachment)}
                </span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
