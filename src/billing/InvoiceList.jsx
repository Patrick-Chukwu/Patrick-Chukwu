import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatIsoDate } from '../../shared/dates.js'
import { STATUS_LABELS } from '../../shared/branding.js'
import { api } from './api.js'
import { Banner, EmptyState, Money, StatusBadge, inputClass, primaryButton, secondaryButton } from './ui.jsx'

const sorts = [
  ['issue_date', 'Issue date'],
  ['due_date', 'Due date'],
  ['number', 'Number'],
  ['client', 'Client'],
  ['total', 'Total'],
  ['paid', 'Paid'],
  ['outstanding', 'Outstanding'],
  ['status', 'Status'],
]

export default function InvoiceList() {
  const [params, setParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const query = {
    q: params.get('q') || '',
    status: params.get('status') || '',
    clientId: params.get('clientId') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    sort: params.get('sort') || 'issue_date',
    dir: params.get('dir') || 'desc',
    page: params.get('page') || '1',
  }

  useEffect(() => {
    api('/api/billing/clients').then((payload) => setClients(payload.items)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api(`/api/billing/invoices?${params.toString()}`).then((payload) => {
      setResult(payload)
      setError('')
    }).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [params])

  function update(next) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value)
      else merged.delete(key)
    })
    if (!('page' in next)) merged.delete('page')
    setParams(merged)
  }

  const page = result?.page || 1
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center gap-3'>
        <h2 className='text-white text-xl'>Invoices</h2>
        <Link to='/billing/invoices/new' className={primaryButton}>New invoice</Link>
      </div>
      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <label className='text-sm text-secondary flex flex-col gap-1 sm:col-span-2'>Search
          <input className={inputClass} value={query.q} onChange={(event) => update({ q: event.target.value })} placeholder='Number, client, or project' />
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Status
          <select className={inputClass} value={query.status} onChange={(event) => update({ status: event.target.value })}>
            <option value=''>All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Client
          <select className={inputClass} value={query.clientId} onChange={(event) => update({ clientId: event.target.value })}>
            <option value=''>All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.businessName}</option>)}
          </select>
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>From<input type='date' className={inputClass} value={query.from} onChange={(event) => update({ from: event.target.value })} /></label>
        <label className='text-sm text-secondary flex flex-col gap-1'>To<input type='date' className={inputClass} value={query.to} onChange={(event) => update({ to: event.target.value })} /></label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Sort
          <select className={inputClass} value={query.sort} onChange={(event) => update({ sort: event.target.value })}>
            {sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Direction
          <select className={inputClass} value={query.dir} onChange={(event) => update({ dir: event.target.value })}>
            <option value='desc'>Newest / highest</option>
            <option value='asc'>Oldest / lowest</option>
          </select>
        </label>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <p>Loading invoices…</p> : null}
      {result && result.items.length === 0 ? <EmptyState>No invoices match these filters.</EmptyState> : null}
      {result && result.items.length > 0 ? (
        <>
          <div className='hidden md:block overflow-x-auto border border-bcolor rounded-lg'>
            <table className='w-full text-sm text-left'>
              <thead className='text-secondary border-b border-bcolor'>
                <tr>
                  {['Invoice', 'Client', 'Project', 'Issued', 'Due', 'Total', 'Paid', 'Outstanding', 'Status', ''].map((heading) => (
                    <th key={heading || 'actions'} className='p-3 font-medium'>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id} className='border-b border-bcolor last:border-0'>
                    <td className='p-3 text-white'>{item.number}</td>
                    <td className='p-3'>{item.clientName || '—'}</td>
                    <td className='p-3'>{item.projectTitle || '—'}</td>
                    <td className='p-3'>{formatIsoDate(item.issueDate) || '—'}</td>
                    <td className='p-3'>{formatIsoDate(item.dueDate) || '—'}</td>
                    <td className='p-3'><Money minor={item.totalMinor} currency={item.currency} /></td>
                    <td className='p-3'><Money minor={item.paidMinor} currency={item.currency} /></td>
                    <td className='p-3'>{item.lifecycle === 'cancelled' ? '—' : <Money minor={item.outstandingMinor} currency={item.currency} />}</td>
                    <td className='p-3'><StatusBadge status={item.status} /></td>
                    <td className='p-3 text-right whitespace-nowrap'>
                      <Link className='hover:text-white mr-3' to={`/billing/invoices/${item.id}`}>View</Link>
                      {item.lifecycle === 'draft' ? <Link className='hover:text-white mr-3' to={`/billing/invoices/${item.id}/edit`}>Edit</Link> : null}
                      <a className='hover:text-white' href={`/api/billing/invoices/${item.id}/pdf`}>PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className='md:hidden flex flex-col gap-3'>
            {result.items.map((item) => (
              <li key={item.id} className='border border-bcolor rounded-lg p-3 flex flex-col gap-2'>
                <div className='flex justify-between gap-2'><span className='text-white'>{item.number}</span><StatusBadge status={item.status} /></div>
                <p>{item.clientName || 'No client'}{item.projectTitle ? ` · ${item.projectTitle}` : ''}</p>
                <p>Due {formatIsoDate(item.dueDate) || '—'} · <Money minor={item.totalMinor} currency={item.currency} /></p>
                <p>Paid <Money minor={item.paidMinor} currency={item.currency} /> · Outstanding {item.lifecycle === 'cancelled' ? '—' : <Money minor={item.outstandingMinor} currency={item.currency} />}</p>
                <div className='flex gap-3'>
                  <Link className='hover:text-white' to={`/billing/invoices/${item.id}`}>View</Link>
                  {item.lifecycle === 'draft' ? <Link className='hover:text-white' to={`/billing/invoices/${item.id}/edit`}>Edit</Link> : null}
                  <a className='hover:text-white' href={`/api/billing/invoices/${item.id}/pdf`}>PDF</a>
                </div>
              </li>
            ))}
          </ul>
          <div className='flex items-center justify-between text-sm'>
            <p>{result.total} invoice{result.total === 1 ? '' : 's'}</p>
            <div className='flex gap-2'>
              <button type='button' className={secondaryButton} disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
              <button type='button' className={secondaryButton} disabled={page >= pages} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
