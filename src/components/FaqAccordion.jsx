/* eslint-disable react/prop-types */
const FaqAccordion = ({ items }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {items.map((item) => (
        <details
          key={item.question}
          className="group border border-bcolor rounded-md px-4 py-3 bg-grey/40 open:border-silver"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-secondary text-left [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand rounded-sm after:content-['+'] after:text-primary after:text-2xl after:leading-none after:transition-transform after:duration-200 group-open:after:rotate-45">
            {item.question}
          </summary>
          <p className="mt-3 text-sm md:text-base text-primary leading-relaxed text-left">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}

export default FaqAccordion
