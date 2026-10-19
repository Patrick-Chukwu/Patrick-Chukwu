import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CURRENCIES, PROFESSIONAL_NAME } from '../../shared/branding.js'
import { todayISO } from '../../shared/dates.js'
import { api } from './api.js'
import InvoicePreview from './InvoicePreview.jsx'
import { formToPreview } from './preview-model.js'
import { Banner, Modal, TextArea, TextInput, inputClass, primaryButton, secondaryButton } from './ui.jsx'

function blankLine() {
  return { key: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' }
}

function emptyClient() {
  return { businessName: '', contactPerson: '', email: '', phone: '', billingAddress: '', taxDetails: '' }
}

function emptyForm(settings) {
  return {
    clientId: '',
    saveClient: false,
    client: emptyClient(),
    projectId: '',
    saveProject: false,
    projectTitle: '',
    projectDescription: '',
    currency: 'NGN',
    issueDate: todayISO(),
    dueDate: '',
    poReference: '',
    paymentTerms: '',
    notes: settings?.defaultNotes || '',
    terms: settings?.defaultTerms || '',
    discount: '',
    discountLabel: '',
    taxRate: '',
    taxLabel: '',
    issuer: {
      professionalName: settings?.professionalName || PROFESSIONAL_NAME,
      businessName: settings?.businessName || '',
      email: settings?.email || '',
      phone: settings?.phone || '',
      address: settings?.address || '',
      paymentInstructions: settings?.paymentInstructions || '',
    },
    lines: [blankLine()],
    milestoneMode: 'none',
    milestones: [],
  }
}

function fromInvoice(invoice) {
  return {
    clientId: invoice.clientId || '',
    saveClient: false,
    client: { ...emptyClient(), ...invoice.client },
    projectId: invoice.projectId || '',
    saveProject: false,
    projectTitle: invoice.projectTitle || '',
    projectDescription: invoice.projectDescription || '',
    currency: invoice.currency,
    issueDate: invoice.issueDate || '',
    dueDate: invoice.dueDate || '',
    poReference: invoice.poReference || '',
    paymentTerms: invoice.paymentTerms || '',
    notes: invoice.notes || '',
    terms: invoice.terms || '',
    discount: invoice.discountMinor ? invoice.discount : '',
    discountLabel: invoice.discountLabel || '',
    taxRate: invoice.taxRateBps ? invoice.taxRate : '',
    taxLabel: invoice.taxLabel || '',
    issuer: invoice.issuer,
    lines: invoice.lines.length ? invoice.lines.map((line) => ({
      key: line.id, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice,
    })) : [blankLine()],
    milestoneMode: invoice.milestoneMode || 'none',
    milestones: invoice.milestones.map((item) => ({
      key: item.id, description: item.description, trigger: item.trigger, percent: item.percent, amount: item.amountMinor ? item.amount : '',
    })),
  }
}

function payloadOf(form) {
  return {
    clientId: form.clientId || null,
    saveClient: form.saveClient,
    client: form.client,
    projectId: form.projectId || null,
    saveProject: form.saveProject,
    projectTitle: form.projectTitle,
    projectDescription: form.projectDescription,
    currency: form.currency,
    issueDate: form.issueDate,
    dueDate: form.dueDate,
    poReference: form.poReference,
    paymentTerms: form.paymentTerms,
    notes: form.notes,
    terms: form.terms,
    discount: form.discount,
    discountLabel: form.discountLabel,
    taxRate: form.taxRate,
    taxLabel: form.taxLabel,
    issuer: form.issuer,
    lines: form.lines.map((line) => ({ description: line.description, quantity: line.quantity, unitPrice: line.unitPrice })),
    milestoneMode: form.milestoneMode,
    milestones: form.milestones.map((item) => ({ description: item.description, trigger: item.trigger, percent: item.percent, amount: item.amount })),
  }
}

function move(list, index, direction) {
  const next = index + direction
  if (next < 0 || next >= list.length) return list
  const copy = list.slice()
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

export default function InvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [number, setNumber] = useState('Draft')
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [confirmIssue, setConfirmIssue] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const [clientPayload, projectPayload, settings] = await Promise.all([
        api('/api/billing/clients'),
        api('/api/billing/projects'),
        api('/api/billing/settings'),
      ])
      if (!active) return
      setClients(clientPayload.items)
      setProjects(projectPayload.items)
      if (!id) {
        setForm(emptyForm(settings))
        return
      }
      const invoice = await api(`/api/billing/invoices/${id}`)
      if (!active) return
      if (invoice.lifecycle !== 'draft') {
        navigate(`/billing/invoices/${id}`, { replace: true })
        return
      }
      setNumber(invoice.number)
      setForm(fromInvoice(invoice))
    }
    load().catch((err) => setError(err.message))
    return () => { active = false }
  }, [id, navigate])

  const preview = useMemo(() => (form ? formToPreview(form, { number, logoUrl: '/api/billing/settings/logo' }) : null), [form, number])

  function patch(partial) {
    setForm((current) => ({ ...current, ...partial }))
  }

  function patchClient(partial) {
    setForm((current) => ({ ...current, client: { ...current.client, ...partial } }))
  }

  function patchIssuer(partial) {
    setForm((current) => ({ ...current, issuer: { ...current.issuer, ...partial } }))
  }

  function chooseClient(clientId) {
    const client = clients.find((item) => item.id === clientId)
    setForm((current) => ({
      ...current,
      clientId,
      client: client ? {
        businessName: client.businessName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        billingAddress: client.billingAddress,
        taxDetails: client.taxDetails,
      } : emptyClient(),
    }))
  }

  function chooseProject(projectId) {
    const project = projects.find((item) => item.id === projectId)
    setForm((current) => ({
      ...current,
      projectId,
      projectTitle: project ? project.title : current.projectTitle,
      projectDescription: project ? project.description : current.projectDescription,
    }))
  }

  async function save() {
    setPending(true)
    setError('')
    setMessage('')
    try {
      const saved = await api(id ? `/api/billing/invoices/${id}` : '/api/billing/invoices', {
        method: id ? 'PUT' : 'POST',
        body: payloadOf(form),
      })
      setNumber(saved.number)
      setMessage('Draft saved.')
      if (!id) navigate(`/billing/invoices/${saved.id}/edit`, { replace: true })
      return saved
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setPending(false)
    }
  }

  async function issue() {
    setConfirmIssue(false)
    const saved = await save()
    if (!saved) return
    setPending(true)
    try {
      await api(`/api/billing/invoices/${saved.id}/issue`, { method: 'POST' })
      navigate(`/billing/invoices/${saved.id}`)
    } catch (err) {
      setError(err.message)
      if (!id) navigate(`/billing/invoices/${saved.id}/edit`, { replace: true })
    } finally {
      setPending(false)
    }
  }

  if (!form) return <p>{error || 'Loading invoice…'}</p>

  return (
    <div className='grid lg:grid-cols-2 gap-6 items-start'>
      <form className='flex flex-col gap-6' onSubmit={(event) => { event.preventDefault(); save() }}>
        <div className='flex justify-between items-center gap-3'>
          <h2 className='text-white text-xl'>{id ? `Edit ${number}` : 'New invoice'}</h2>
          <Link to='/billing/invoices' className='text-sm hover:text-white'>All invoices</Link>
        </div>
        {error ? <Banner>{error}</Banner> : null}
        {message ? <Banner tone='success'>{message}</Banner> : null}

        <section className='flex flex-col gap-3 border border-bcolor rounded-lg p-4'>
          <h3 className='text-white font-medium'>1. Issuer</h3>
          <p className='text-xs text-greylight'>These details are stored on this invoice. Changing them does not change the public website. The logo comes from billing settings and is copied when you issue.</p>
          <TextInput label='Professional name' value={form.issuer.professionalName} onChange={(event) => patchIssuer({ professionalName: event.target.value })} />
          <TextInput label='Business or trading name' value={form.issuer.businessName} onChange={(event) => patchIssuer({ businessName: event.target.value })} />
          <div className='grid sm:grid-cols-2 gap-3'>
            <TextInput label='Email' type='email' value={form.issuer.email} onChange={(event) => patchIssuer({ email: event.target.value })} />
            <TextInput label='Phone' value={form.issuer.phone} onChange={(event) => patchIssuer({ phone: event.target.value })} />
          </div>
          <TextArea label='Address' value={form.issuer.address} onChange={(event) => patchIssuer({ address: event.target.value })} />
          <TextArea label='Payment instructions' value={form.issuer.paymentInstructions} onChange={(event) => patchIssuer({ paymentInstructions: event.target.value })} />
        </section>

        <section className='flex flex-col gap-3 border border-bcolor rounded-lg p-4'>
          <h3 className='text-white font-medium'>2. Client</h3>
          <label className='text-sm text-secondary flex flex-col gap-1'>Saved client
            <select className={inputClass} value={form.clientId} onChange={(event) => chooseClient(event.target.value)}>
              <option value=''>New client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.businessName}</option>)}
            </select>
          </label>
          <TextInput label='Client or business name' value={form.client.businessName} onChange={(event) => patchClient({ businessName: event.target.value })} />
          <TextInput label='Contact person (optional)' value={form.client.contactPerson} onChange={(event) => patchClient({ contactPerson: event.target.value })} />
          <div className='grid sm:grid-cols-2 gap-3'>
            <TextInput label='Email' type='email' value={form.client.email} onChange={(event) => patchClient({ email: event.target.value })} />
            <TextInput label='Phone (optional)' value={form.client.phone} onChange={(event) => patchClient({ phone: event.target.value })} />
          </div>
          <TextArea label='Billing address (optional)' value={form.client.billingAddress} onChange={(event) => patchClient({ billingAddress: event.target.value })} />
          <TextInput label='Tax or registration details (optional)' value={form.client.taxDetails} onChange={(event) => patchClient({ taxDetails: event.target.value })} />
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={form.saveClient} onChange={(event) => patch({ saveClient: event.target.checked })} />
            {form.clientId ? 'Update the saved client' : 'Save as a reusable client'}
          </label>
        </section>

        <section className='flex flex-col gap-3 border border-bcolor rounded-lg p-4'>
          <h3 className='text-white font-medium'>3. Invoice details</h3>
          <div className='grid sm:grid-cols-2 gap-3'>
            <TextInput label='Issue date' type='date' value={form.issueDate} onChange={(event) => patch({ issueDate: event.target.value })} />
            <TextInput label='Due date' type='date' value={form.dueDate} onChange={(event) => patch({ dueDate: event.target.value })} />
          </div>
          <label className='text-sm text-secondary flex flex-col gap-1'>Currency
            <select className={inputClass} value={form.currency} onChange={(event) => patch({ currency: event.target.value })}>
              {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}
            </select>
          </label>
          <p className='text-xs text-greylight'>Amounts stay in the currency you choose. Nothing is converted.</p>
          <label className='text-sm text-secondary flex flex-col gap-1'>Saved project
            <select className={inputClass} value={form.projectId} onChange={(event) => chooseProject(event.target.value)}>
              <option value=''>Type a project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </label>
          <TextInput label='Project title' value={form.projectTitle} onChange={(event) => patch({ projectTitle: event.target.value })} />
          <TextArea label='Project description' value={form.projectDescription} onChange={(event) => patch({ projectDescription: event.target.value })} />
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={form.saveProject} onChange={(event) => patch({ saveProject: event.target.checked })} />
            Save project for reuse
          </label>
          <TextInput label='PO or reference (optional)' value={form.poReference} onChange={(event) => patch({ poReference: event.target.value })} />
          <TextInput label='Payment terms' value={form.paymentTerms} onChange={(event) => patch({ paymentTerms: event.target.value })} />
          <TextArea label='Notes' value={form.notes} onChange={(event) => patch({ notes: event.target.value })} />
          <TextArea label='Terms' value={form.terms} onChange={(event) => patch({ terms: event.target.value })} />
        </section>

        <section className='flex flex-col gap-3 border border-bcolor rounded-lg p-4'>
          <h3 className='text-white font-medium'>4. Line items</h3>
          {form.lines.map((line, index) => (
            <div key={line.key} className='grid sm:grid-cols-12 gap-2 items-end border border-bcolor rounded-md p-2'>
              <div className='sm:col-span-5'><TextInput label='Description' value={line.description} onChange={(event) => patch({ lines: form.lines.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} /></div>
              <div className='sm:col-span-2'><TextInput label='Qty' inputMode='decimal' value={line.quantity} onChange={(event) => patch({ lines: form.lines.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item) })} /></div>
              <div className='sm:col-span-3'><TextInput label='Unit price' inputMode='decimal' value={line.unitPrice} onChange={(event) => patch({ lines: form.lines.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: event.target.value } : item) })} /></div>
              <div className='sm:col-span-2 flex gap-1'>
                <button type='button' className={secondaryButton} aria-label='Move line up' onClick={() => patch({ lines: move(form.lines, index, -1) })}>↑</button>
                <button type='button' className={secondaryButton} aria-label='Move line down' onClick={() => patch({ lines: move(form.lines, index, 1) })}>↓</button>
                <button type='button' className={secondaryButton} aria-label='Remove line' onClick={() => patch({ lines: form.lines.filter((_, itemIndex) => itemIndex !== index) })}>×</button>
              </div>
            </div>
          ))}
          <button type='button' className={secondaryButton} onClick={() => patch({ lines: [...form.lines, blankLine()] })}>Add line</button>
          <div className='grid sm:grid-cols-2 gap-3'>
            <TextInput label='Discount amount (optional)' inputMode='decimal' value={form.discount} onChange={(event) => patch({ discount: event.target.value })} />
            <TextInput label='Discount label' value={form.discountLabel} onChange={(event) => patch({ discountLabel: event.target.value })} />
            <TextInput label='Tax rate % (optional)' inputMode='decimal' value={form.taxRate} onChange={(event) => patch({ taxRate: event.target.value })} />
            <TextInput label='Tax label' value={form.taxLabel} onChange={(event) => patch({ taxLabel: event.target.value })} />
          </div>
          <p className='text-xs text-greylight'>Discount and tax stay at zero unless you enter them.</p>
        </section>

        <section className='flex flex-col gap-3 border border-bcolor rounded-lg p-4'>
          <h3 className='text-white font-medium'>5. Payment schedule</h3>
          <p className='text-xs text-greylight'>Optional. Example shape, not a saved charge: 50% commencement, 30% delivery, 20% final review. Percentages must total 100% before issuing. Milestone amounts are parts of the invoice total.</p>
          <label className='text-sm text-secondary flex flex-col gap-1'>Schedule type
            <select className={inputClass} value={form.milestoneMode} onChange={(event) => patch({ milestoneMode: event.target.value, milestones: event.target.value === 'none' ? [] : form.milestones })}>
              <option value='none'>No schedule</option>
              <option value='percent'>Percentages of the total</option>
              <option value='amount'>Fixed amounts</option>
            </select>
          </label>
          {form.milestoneMode !== 'none' ? form.milestones.map((item, index) => (
            <div key={item.key} className='grid sm:grid-cols-2 gap-2 border border-bcolor rounded-md p-2'>
              <TextInput label='Description' value={item.description} onChange={(event) => patch({ milestones: form.milestones.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row) })} />
              <TextInput label='Trigger' value={item.trigger} onChange={(event) => patch({ milestones: form.milestones.map((row, rowIndex) => rowIndex === index ? { ...row, trigger: event.target.value } : row) })} />
              {form.milestoneMode === 'percent'
                ? <TextInput label='Percent' inputMode='decimal' value={item.percent} onChange={(event) => patch({ milestones: form.milestones.map((row, rowIndex) => rowIndex === index ? { ...row, percent: event.target.value } : row) })} />
                : <TextInput label='Amount' inputMode='decimal' value={item.amount} onChange={(event) => patch({ milestones: form.milestones.map((row, rowIndex) => rowIndex === index ? { ...row, amount: event.target.value } : row) })} />}
              <div className='flex gap-2 items-end'>
                <button type='button' className={secondaryButton} aria-label='Move milestone up' onClick={() => patch({ milestones: move(form.milestones, index, -1) })}>↑</button>
                <button type='button' className={secondaryButton} aria-label='Move milestone down' onClick={() => patch({ milestones: move(form.milestones, index, 1) })}>↓</button>
                <button type='button' className={secondaryButton} onClick={() => patch({ milestones: form.milestones.filter((_, rowIndex) => rowIndex !== index) })}>Remove</button>
              </div>
            </div>
          )) : null}
          {form.milestoneMode !== 'none' ? (
            <button type='button' className={secondaryButton} onClick={() => patch({ milestones: [...form.milestones, { key: crypto.randomUUID(), description: '', trigger: '', percent: '', amount: '' }] })}>Add milestone</button>
          ) : null}
        </section>

        <div className='flex flex-wrap gap-2'>
          <button type='submit' className={primaryButton} disabled={pending}>{pending ? 'Saving…' : 'Save draft'}</button>
          <button type='button' className={secondaryButton} disabled={pending} onClick={() => setConfirmIssue(true)}>Issue invoice</button>
        </div>
      </form>
      <div className='lg:sticky lg:top-24'>
        <div className='flex justify-between items-center mb-2 no-print'>
          <h2 className='text-white'>Preview</h2>
          <button type='button' className={secondaryButton} onClick={() => window.print()}>Print view</button>
        </div>
        <InvoicePreview preview={preview} />
      </div>
      {confirmIssue ? (
        <Modal title='Issue this invoice?' onClose={() => setConfirmIssue(false)}>
          <p className='text-sm text-secondary mb-4'>Issuing locks the client and financial details on this document. Later edits need a revision or cancellation. No payment is recorded by issuing.</p>
          <div className='flex gap-2 justify-end'>
            <button type='button' className={secondaryButton} onClick={() => setConfirmIssue(false)}>Back</button>
            <button type='button' className={primaryButton} onClick={issue}>Issue invoice</button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
