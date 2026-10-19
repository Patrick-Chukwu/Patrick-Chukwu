import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatIsoDate } from '../../shared/dates.js'
import { api } from './api.js'
import { Banner, EmptyState, Money, inputClass, secondaryButton } from './ui.jsx'

export default function ReceiptsPage() {
  const [clients, setClients] = useState([])
  const [filters, setFilters] = useState({ q: '', clientId: '', from: '', to: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/billing/clients').then((payload) => setClients(payload.items)).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    setLoading(true)
    api(`/api/billing/receipts?${params.toString()}`).then((payload) => {
      setResult(payload)
      setError('')
    }).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [filters])

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-white text-xl'>Receipts</h2>
      <p className='text-sm text-secondary'>A receipt exists only for a payment that was saved. Downloading it again keeps the same receipt number.</p>
      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <label className='text-sm text-secondary flex flex-col gap-1'>Search
          <input className={inputClass} value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>Client
          <select className={inputClass} value={filters.clientId} onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}>
            <option value=''>All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.businessName}</option>)}
          </select>
        </label>
        <label className='text-sm text-secondary flex flex-col gap-1'>From<input type='date' className={inputClass} value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label className='text-sm text-secondary flex flex-col gap-1'>To<input type='date' className={inputClass} value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <p>Loading receipts…</p> : null}
      {result && result.items.length === 0 ? <EmptyState>No receipts yet.</EmptyState> : null}
      {result && result.items.length > 0 ? (
        <div className='overflow-x-auto border border-bcolor rounded-lg'>
          <table className='w-full text-sm text-left'>
            <thead className='text-secondary border-b border-bcolor'>
              <tr>
                {['Receipt', 'Client', 'Invoice', 'Date', 'Amount', 'Method', 'Reference', ''].map((heading) => <th key={heading || 'actions'} className='p-3 font-medium'>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id} className='border-b border-bcolor last:border-0'>
                  <td className='p-3 text-white'>{item.number}</td>
                  <td className='p-3'>{item.clientName}</td>
                  <td className='p-3'><Link className='hover:text-white' to={`/billing/invoices/${item.invoiceId}`}>{item.invoiceNumber}</Link></td>
                  <td className='p-3'>{formatIsoDate(item.receivedOn)}</td>
                  <td className='p-3'><Money minor={item.amountMinor} currency={item.currency} /></td>
                  <td className='p-3'>{item.methodLabel}</td>
                  <td className='p-3'>{item.reference || '—'}</td>
                  <td className='p-3'><a className={secondaryButton} href={`/api/billing/receipts/${item.id}/pdf`}>PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
