import { money } from './preview-model.js'

function Lines({ party }) {
  const rows = [
    party?.businessName,
    party?.contactPerson,
    party?.email,
    party?.phone,
    party?.address || party?.billingAddress,
    party?.taxDetails,
  ].filter(Boolean)
  if (!rows.length) return <p className='text-greylight'>Not set</p>
  return rows.map((row) => <p key={row}>{row}</p>)
}

export default function InvoicePreview({ preview }) {
  if (!preview?.ok) {
    return <p className='text-sm text-secondary'>Preview updates when the amounts are valid. {preview?.message}</p>
  }
  const model = preview.model
  return (
    <article className='print-sheet bg-white text-grey rounded-md p-4 sm:p-8 shadow-sm text-sm leading-6'>
      <header className='flex gap-4 items-start justify-between border-b border-secondary pb-4'>
        <div className='flex gap-3 items-center'>
          {model.logoUrl ? <img src={model.logoUrl} alt='' className='h-12 w-12 rounded-full object-cover bg-primary' /> : null}
          <div>
            <p className='text-xs tracking-wide text-ash'>{model.status === 'draft' ? 'DRAFT INVOICE' : 'INVOICE'}</p>
            <h2 className='text-xl font-semibold text-brand'>{model.issuer.professionalName || 'Patrick Chukwu'}</h2>
            {model.issuer.businessName ? <p>{model.issuer.businessName}</p> : null}
          </div>
        </div>
        <div className='text-right'>
          <p className='font-semibold'>{model.number}</p>
          <p>{model.statusLabel}</p>
        </div>
      </header>
      <div className='grid sm:grid-cols-2 gap-4 py-4'>
        <div>
          <p className='text-xs text-ash'>From</p>
          <Lines party={model.issuer} />
        </div>
        <div>
          <p className='text-xs text-ash'>Bill to</p>
          <Lines party={model.client} />
        </div>
      </div>
      <dl className='grid grid-cols-2 gap-2 text-xs sm:text-sm pb-4'>
        <div><dt className='text-ash'>Issue date</dt><dd>{model.issueDate || '—'}</dd></div>
        <div><dt className='text-ash'>Due date</dt><dd>{model.dueDate || '—'}</dd></div>
        <div><dt className='text-ash'>Currency</dt><dd>{model.currency}</dd></div>
        {model.poReference ? <div><dt className='text-ash'>PO / reference</dt><dd>{model.poReference}</dd></div> : null}
      </dl>
      {model.projectTitle ? <h3 className='font-semibold text-base text-brand'>{model.projectTitle}</h3> : null}
      {model.projectDescription ? <p className='pb-3'>{model.projectDescription}</p> : null}
      {model.cancelled ? <p className='font-medium pb-3'>This invoice was cancelled and is not collectible.</p> : null}
      <div className='overflow-x-auto'>
        <table className='w-full text-left border-collapse'>
          <thead className='bg-lightpowder text-brand'>
            <tr>
              <th className='p-2 font-medium'>Description</th>
              <th className='p-2 font-medium text-right'>Qty</th>
              <th className='p-2 font-medium text-right'>Unit price</th>
              <th className='p-2 font-medium text-right'>Amount</th>
            </tr>
          </thead>
          <tbody>
            {model.lines.length === 0 ? (
              <tr><td className='p-2 text-greylight' colSpan={4}>No line items yet</td></tr>
            ) : model.lines.map((line) => (
              <tr key={`${line.description}-${line.quantity}-${line.lineTotalMinor}`} className='border-b border-secondary'>
                <td className='p-2'>{line.description}</td>
                <td className='p-2 text-right'>{line.quantity}</td>
                <td className='p-2 text-right'>{money(line.unitPriceMinor, model.currency)}</td>
                <td className='p-2 text-right'>{money(line.lineTotalMinor, model.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className='ml-auto max-w-xs mt-4 space-y-1'>
        <div className='flex justify-between'><dt>Subtotal</dt><dd>{money(model.subtotalMinor, model.currency)}</dd></div>
        {model.discountMinor > 0 ? <div className='flex justify-between'><dt>{model.discountLabel || 'Discount'}</dt><dd>-{money(model.discountMinor, model.currency)}</dd></div> : null}
        {model.taxMinor > 0 ? <div className='flex justify-between'><dt>{model.taxLabel || 'Tax'}</dt><dd>{money(model.taxMinor, model.currency)}</dd></div> : null}
        <div className='flex justify-between font-semibold text-brand'><dt>Invoice total</dt><dd>{money(model.totalMinor, model.currency)}</dd></div>
        {model.paidMinor > 0 ? <div className='flex justify-between'><dt>Paid to date</dt><dd>{money(model.paidMinor, model.currency)}</dd></div> : null}
        <div className='flex justify-between font-semibold'><dt>{model.cancelled ? 'Outstanding' : 'Outstanding balance'}</dt><dd>{model.cancelled ? 'Not collectible' : money(model.outstandingMinor, model.currency)}</dd></div>
        {model.overpaidMinor > 0 ? <div className='flex justify-between'><dt>Overpayment</dt><dd>{money(model.overpaidMinor, model.currency)}</dd></div> : null}
      </dl>
      {model.milestones.length ? (
        <section className='mt-6'>
          <h3 className='font-semibold text-brand'>Payment schedule</h3>
          <p className='text-xs text-ash'>These amounts are portions of the invoice total, not additional charges.</p>
          {model.scheduleMessage ? <p className='text-xs'>{model.scheduleMessage}</p> : null}
          <ol className='mt-2 space-y-1'>
            {model.milestones.map((item, index) => (
              <li key={`${item.description}-${index}`} className='flex justify-between gap-3 border-b border-secondary py-1'>
                <span>{index + 1}. {item.description}{item.trigger ? ` — ${item.trigger}` : ''}{item.percent ? ` (${item.percent}%)` : ''}</span>
                <span>{money(item.amountMinor, model.currency)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {model.paymentTerms ? <section className='mt-4'><h3 className='font-semibold'>Payment terms</h3><p>{model.paymentTerms}</p></section> : null}
      {model.issuer.paymentInstructions ? <section className='mt-4'><h3 className='font-semibold'>Payment instructions</h3><p className='whitespace-pre-wrap'>{model.issuer.paymentInstructions}</p></section> : null}
      {model.notes ? <section className='mt-4'><h3 className='font-semibold'>Notes</h3><p className='whitespace-pre-wrap'>{model.notes}</p></section> : null}
      {model.terms ? <section className='mt-4'><h3 className='font-semibold'>Terms</h3><p className='whitespace-pre-wrap'>{model.terms}</p></section> : null}
    </article>
  )
}
