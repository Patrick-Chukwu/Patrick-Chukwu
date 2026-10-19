import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatIsoDate } from '../../shared/dates.js'
import { formatMinor } from '../../shared/money.js'
import { api } from './api.js'
import { Banner, EmptyState, StatusBadge, inputClass, primaryButton } from './ui.jsx'

const cards = [
  ['invoicedMinor', 'Total invoiced'],
  ['paymentsMinor', 'Payments received'],
  ['outstandingMinor', 'Outstanding'],
  ['overdueCount', 'Overdue invoices', true],
  ['invoiceCount', 'Invoices issued', true],
  ['receiptCount', 'Receipts', true],
]

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [filters, setFilters] = useState({ from: '', to: '', clientId: '', projectId: '', status: '' })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/billing/clients').then((payload) => setClients(payload.items)).catch(() => {})
    api('/api/billing/projects').then((payload) => setProjects(payload.items)).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    setLoading(true)
    api(`/api/billing/dashboard?${params.toString()}`).then((payload) => {
      setData(payload)
      setError('')
    }).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [filters])

  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap gap-2 justify-between items-center'>
        <p className='text-sm text-secondary'>Figures come from saved invoices and payments. Date range uses the invoice issue date. Drafts and cancelled invoices are left out of the money totals.</p>
        <Link to='/billing/invoices/new' className={primaryButton}>New invoice</Link>
      </div>
      <div className='grid sm:grid-cols-2 lg:grid-cols-5 gap-3'>
        <label className='text-sm text-secondary flex flex-col gap-1'>From<input type='date' className={inputClass} value={filters.from} onChange={(event) => update('from', event.target.value)} /></label>
        <label className='text-sm text-secondary flex flex-col gap-1'>To<input type='date' className={inputClass} value={filters.to} onChange={(event) => update('to', event.target.value)} /></label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Client
          <select className={inputClass} value={filters.clientId} onChange={(event) => update('clientId', event.target.value)}>
            <option value=''>All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.businessName}</option>)}
          </select>
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Project
          <select className={inputClass} value={filters.projectId} onChange={(event) => update('projectId', event.target.value)}>
            <option value=''>All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          </select>
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Status
          <select className={inputClass} value={filters.status} onChange={(event) => update('status', event.target.value)}>
            <option value=''>All statuses</option>
            {['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
        </label>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <p>Loading dashboard…</p> : null}
      {data ? (
        <>
          <section className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
            {cards.map(([key, label, plain]) => (
              <Link key={key} to={key === 'overdueCount' ? '/billing/invoices?status=overdue' : '/billing/invoices'} className='border border-bcolor rounded-lg p-4 hover:border-secondary'>
                <p className='text-sm text-secondary'>{label}</p>
                <p className='text-white text-2xl font-medium mt-1'>{plain ? data.cards[key] : (data.cards.currency ? formatMinor(data.cards[key], data.cards.currency) : 'Mixed')}</p>
              </Link>
            ))}
          </section>
          {data.totalsByCurrency.length > 1 ? (
            <ul className='text-sm text-secondary'>
              {data.totalsByCurrency.map((row) => (
                <li key={row.currency}>{row.currency}: invoiced {formatMinor(row.invoicedMinor, row.currency)}, received {formatMinor(row.paymentsMinor, row.currency)}, outstanding {formatMinor(row.outstandingMinor, row.currency)}. Currencies are not converted.</li>
              ))}
            </ul>
          ) : <p className='text-xs text-greylight'>Totals use the currency stored on each invoice. No exchange rate is applied.</p>}
          <section className='grid lg:grid-cols-2 gap-6'>
            <div>
              <h2 className='text-white text-lg mb-2'>Recent activity</h2>
              {data.recent.length === 0 ? <EmptyState>No activity for these filters yet.</EmptyState> : (
                <ul className='flex flex-col gap-2'>
                  {data.recent.map((item) => (
                    <li key={item.id} className='border border-bcolor rounded-md px-3 py-2'>
                      <p>{item.summary}{item.amountMinor != null ? ` · ${formatMinor(item.amountMinor, item.currency || 'NGN')}` : ''}</p>
                      <p className='text-xs text-greylight'>{new Date(item.createdAt).toLocaleString('en-GB')}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className='flex flex-col gap-4'>
              <div>
                <h2 className='text-white text-lg mb-2'>Coming due</h2>
                {data.upcoming.length === 0 ? <EmptyState>Nothing is due in the next 14 days.</EmptyState> : (
                  <ul className='flex flex-col gap-2'>
                    {data.upcoming.map((item) => (
                      <li key={item.id}><Link className='hover:text-white' to={`/billing/invoices/${item.id}`}>{item.number} · {item.clientName} · {formatIsoDate(item.dueDate)} · {formatMinor(item.outstandingMinor, item.currency)}</Link></li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className='text-white text-lg mb-2'>Overdue</h2>
                {data.overdue.length === 0 ? <EmptyState>No overdue invoices in this filter.</EmptyState> : (
                  <ul className='flex flex-col gap-2'>
                    {data.overdue.map((item) => (
                      <li key={item.id} className='flex items-center justify-between gap-2'>
                        <Link className='hover:text-white' to={`/billing/invoices/${item.id}`}>{item.number} · {item.clientName}</Link>
                        <StatusBadge status={item.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
