import { useEffect, useState } from 'react'
import { PROFESSIONAL_NAME } from '../../shared/branding.js'
import { api } from './api.js'
import { Banner, TextArea, TextInput, primaryButton, secondaryButton } from './ui.jsx'

export default function SettingsPage() {
  const [form, setForm] = useState(null)
  const [logoBase64, setLogoBase64] = useState('')
  const [clearLogo, setClearLogo] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    api('/api/billing/settings').then(setForm).catch((err) => setError(err.message))
  }, [])

  function onLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogoBase64(String(reader.result || ''))
      setClearLogo(false)
    }
    reader.readAsDataURL(file)
  }

  async function save(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    try {
      const saved = await api('/api/billing/settings', {
        method: 'PUT',
        body: { ...form, ...(logoBase64 ? { logoBase64 } : {}), ...(clearLogo ? { clearLogo: true } : {}) },
      })
      setForm(saved)
      setLogoBase64('')
      setClearLogo(false)
      setMessage('Invoice settings saved. The public site logo and pages are unchanged. Issued invoices keep the logo and details they were issued with.')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  if (!form) return <p>{error || 'Loading settings…'}</p>

  return (
    <form onSubmit={save} className='max-w-xl flex flex-col gap-3'>
      <h2 className='text-white text-xl'>Invoice settings</h2>
      <p className='text-sm text-secondary'>Defaults for new invoices. Unknown contact details stay blank until you fill them in.</p>
      {error ? <Banner>{error}</Banner> : null}
      {message ? <Banner tone='success'>{message}</Banner> : null}
      <TextInput label='Professional name' value={form.professionalName} onChange={(event) => setForm({ ...form, professionalName: event.target.value })} placeholder={PROFESSIONAL_NAME} />
      <TextInput label='Business or trading name' value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
      <TextInput label='Email' type='email' value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <TextInput label='Phone' value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      <TextArea label='Address' value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
      <TextArea label='Payment instructions' value={form.paymentInstructions} onChange={(event) => setForm({ ...form, paymentInstructions: event.target.value })} />
      <TextArea label='Default notes for new invoices' value={form.defaultNotes} onChange={(event) => setForm({ ...form, defaultNotes: event.target.value })} />
      <TextArea label='Default terms for new invoices' value={form.defaultTerms} onChange={(event) => setForm({ ...form, defaultTerms: event.target.value })} />
      <div className='flex flex-col gap-2 text-sm'>
        <span className='text-secondary'>Logo</span>
        <img src={logoBase64 || `/api/billing/settings/logo?t=${form.updatedAt || ''}`} alt='Invoice logo' className='h-16 w-16 rounded-full object-cover bg-primary' />
        <input type='file' accept='image/png,image/jpeg' onChange={onLogo} className='text-sm' />
        <button type='button' className={secondaryButton} onClick={() => { setClearLogo(true); setLogoBase64('') }}>Use the website portrait</button>
      </div>
      <button className={primaryButton} type='submit' disabled={pending}>{pending ? 'Saving…' : 'Save settings'}</button>
    </form>
  )
}
