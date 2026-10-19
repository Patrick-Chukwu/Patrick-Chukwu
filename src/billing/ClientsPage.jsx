import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api.js'
import { Banner, EmptyState, TextArea, TextInput, primaryButton, secondaryButton } from './ui.jsx'

const blank = { businessName: '', contactPerson: '', email: '', phone: '', billingAddress: '', taxDetails: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState('')
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    return api('/api/billing/clients').then((payload) => setClients(payload.items)).finally(() => setLoading(false))
  }

  useEffect(() => { load().catch((err) => setError(err.message)) }, [])

  function edit(client) {
    setSelected(client.id)
    setForm({
      businessName: client.businessName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      billingAddress: client.billingAddress,
      taxDetails: client.taxDetails,
    })
    setMessage('')
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    try {
      const saved = selected
        ? await api(`/api/billing/clients/${selected}`, { method: 'PUT', body: form })
        : await api('/api/billing/clients', { method: 'POST', body: form })
      await load()
      setSelected(saved.id)
      setMessage('Client saved. Issued invoices keep the details they were issued with.')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className='grid lg:grid-cols-2 gap-6'>
      <section>
        <div className='flex justify-between items-center mb-3'>
          <h2 className='text-white text-xl'>Clients</h2>
          <button type='button' className={secondaryButton} onClick={() => { setSelected(''); setForm(blank); setMessage('') }}>New client</button>
        </div>
        {loading ? <p>Loading clients…</p> : null}
        {!loading && clients.length === 0 ? <EmptyState>No clients yet. Add one here or while creating an invoice.</EmptyState> : null}
        {!loading && clients.length > 0 ? (
          <ul className='flex flex-col gap-2'>
            {clients.map((client) => (
              <li key={client.id}>
                <button type='button' onClick={() => edit(client)} className={`w-full text-left border rounded-md px-3 py-2 hover:text-white ${selected === client.id ? 'border-primary text-white' : 'border-bcolor'}`}>
                  <span className='block'>{client.businessName}</span>
                  <span className='text-xs text-greylight'>{client.email || 'No email'}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <form onSubmit={save} className='flex flex-col gap-3 border border-bcolor rounded-lg p-4'>
        <h3 className='text-white font-medium'>{selected ? 'Edit client' : 'Add client'}</h3>
        {error ? <Banner>{error}</Banner> : null}
        {message ? <Banner tone='success'>{message}</Banner> : null}
        <TextInput label='Client or business name' required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
        <TextInput label='Contact person (optional)' value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
        <TextInput label='Email' type='email' value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <TextInput label='Phone (optional)' value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <TextArea label='Billing address (optional)' value={form.billingAddress} onChange={(event) => setForm({ ...form, billingAddress: event.target.value })} />
        <TextInput label='Tax or registration details (optional)' value={form.taxDetails} onChange={(event) => setForm({ ...form, taxDetails: event.target.value })} />
        <button className={primaryButton} type='submit' disabled={pending}>{pending ? 'Saving…' : 'Save client'}</button>
        {selected ? <Link className='text-sm hover:text-white' to={`/billing/invoices?clientId=${selected}`}>View this client&apos;s invoices</Link> : null}
      </form>
    </div>
  )
}
