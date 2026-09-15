/* eslint-disable react/prop-types */
import { useState } from 'react'
import { copyText } from '../utils/files'

const variants = {
  primary:
    'bg-primary text-black py-2.5 px-5 w-full sm:w-fit text-center font-medium rounded-md hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors disabled:opacity-70',
  secondary:
    'text-white bg-bcolor px-5 py-2.5 w-full sm:w-fit text-center font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors disabled:opacity-70',
  ghost:
    'text-secondary border border-bcolor py-2 px-4 w-full sm:w-fit text-center font-medium rounded-md hover:border-silver hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors disabled:opacity-70',
}

const CopyButton = ({
  text,
  label,
  copiedLabel = 'Copied',
  variant = 'ghost',
  className = '',
}) => {
  const [status, setStatus] = useState('idle')

  const handleCopy = async () => {
    try {
      await copyText(text)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    window.setTimeout(() => setStatus('idle'), 2000)
  }

  const visibleLabel =
    status === 'copied' ? copiedLabel : status === 'error' ? 'Copy failed' : label

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${variants[variant] || variants.ghost} ${className}`}
    >
      {visibleLabel}
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Copied to clipboard'
          : status === 'error'
            ? 'Could not copy. Please try again.'
            : ''}
      </span>
    </button>
  )
}

export default CopyButton
