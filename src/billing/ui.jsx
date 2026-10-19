import { useEffect, useId } from 'react'
import { STATUS_LABELS } from '../../shared/branding.js'
import { formatMinor } from '../../shared/money.js'

export const inputClass = 'scroll-mt-28 bg-grey border border-bcolor rounded-md px-3 py-2 text-white placeholder:text-greylight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
export const primaryButton = 'bg-primary text-black rounded-md px-3 py-2 font-medium hover:bg-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
export const secondaryButton = 'border border-bcolor text-secondary rounded-md px-3 py-2 hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
export const dangerButton = 'border border-ash text-secondary rounded-md px-3 py-2 hover:bg-ash hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function Field({ label, children }) {
  const id = useId()
  return (
    <label htmlFor={id} className='flex flex-col gap-1 text-sm text-secondary'>
      <span>{label}</span>
      {typeof children === 'function' ? children(id) : children}
    </label>
  )
}

export function TextInput({ label, ...props }) {
  return (
    <Field label={label}>
      {(id) => <input id={id} className={inputClass} {...props} />}
    </Field>
  )
}

export function TextArea({ label, ...props }) {
  return (
    <Field label={label}>
      {(id) => <textarea id={id} className={`${inputClass} min-h-24`} {...props} />}
    </Field>
  )
}

export function SelectInput({ label, children, ...props }) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} className={inputClass} {...props}>
          {children}
        </select>
      )}
    </Field>
  )
}

export function Banner({ tone = 'error', children }) {
  const toneClass = tone === 'success' ? 'border-secondary text-white' : 'border-ash text-secondary'
  return <div role='status' aria-live='polite' className={`border ${toneClass} rounded-md px-3 py-2 text-sm`}>{children}</div>
}

export function StatusBadge({ status }) {
  return (
    <span className='inline-flex items-center rounded-full border border-bcolor bg-grey px-2 py-0.5 text-xs text-white'>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function Money({ minor, currency }) {
  return <span className='tabular-nums'>{formatMinor(minor || 0, currency || 'NGN')}</span>
}

export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4' onClick={onClose}>
      <div role='dialog' aria-modal='true' aria-labelledby='billing-dialog-title' className='bg-brand border border-bcolor rounded-lg w-full max-w-lg p-4 max-h-[90dvh] overflow-y-auto' onClick={(event) => event.stopPropagation()}>
        <h2 id='billing-dialog-title' className='text-white text-lg font-medium mb-3'>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ children }) {
  return <p className='text-secondary border border-dashed border-bcolor rounded-md px-4 py-8 text-center'>{children}</p>
}
