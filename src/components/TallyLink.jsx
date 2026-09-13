/* eslint-disable react/prop-types */
export const TALLY_FORM_URL = 'https://tally.so/r/A7Eb5e'

const variantClasses = {
  primary:
    'bg-primary text-black py-2 px-5 w-fit font-medium rounded-md border border-transparent hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand',
  secondary:
    'text-white bg-bcolor px-5 py-2 w-fit font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand',
  text: 'font-medium text-secondary underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
}

const TallyLink = ({ children, className = '', variant = 'primary' }) => {
  return (
    <a
      href={TALLY_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${variantClasses[variant] || variantClasses.primary} ${className}`}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

export default TallyLink
