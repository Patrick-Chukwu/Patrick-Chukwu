import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../assets/Patrick.png'
import { api } from './api.js'
import { Banner, TextInput, primaryButton, secondaryButton } from './ui.jsx'

const links = [
  ['/billing', 'Dashboard'],
  ['/billing/invoices', 'Invoices'],
  ['/billing/clients', 'Clients'],
  ['/billing/receipts', 'Receipts'],
  ['/billing/settings', 'Settings'],
]

function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await api('/api/billing/login', { method: 'POST', body: { password } })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }
  return (
    <form onSubmit={submit} className='max-w-md mx-auto mt-10 flex flex-col gap-4 border border-bcolor rounded-lg p-4'>
      <h1 className='text-white text-2xl font-medium'>Invoices & receipts</h1>
      <p className='text-sm text-secondary'>Private workspace for Patrick Chukwu. This area is not part of the public site.</p>
      {error ? <Banner>{error}</Banner> : null}
      <TextInput label='Admin password' type='password' autoComplete='current-password' value={password} onChange={(event) => setPassword(event.target.value)} required />
      <button className={primaryButton} type='submit' disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}

export default function BillingLayout() {
  const navigate = useNavigate()
  const [session, setSession] = useState({ loading: true, authenticated: false })
  useEffect(() => {
    const previous = document.title
    document.title = 'Invoices & receipts · Patrick Chukwu'
    let robots = document.querySelector('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    const previousRobots = robots.getAttribute('content')
    robots.setAttribute('content', 'noindex, nofollow')
    return () => {
      document.title = previous
      if (created) robots.remove()
      else robots.setAttribute('content', previousRobots || '')
    }
  }, [])
  useEffect(() => {
    let active = true
    api('/api/billing/session').then((payload) => {
      if (active) setSession({ loading: false, authenticated: payload.authenticated })
    }).catch((error) => {
      if (active) setSession({ loading: false, authenticated: false, error: error.message })
    })
    return () => { active = false }
  }, [])
  async function logout() {
    await api('/api/billing/logout', { method: 'POST' })
    setSession({ loading: false, authenticated: false })
    navigate('/billing')
  }
  return (
    <div className='min-h-dvh bg-brand text-primary'>
      <header className='no-print border-b border-bcolor bg-brand sticky top-0 z-40'>
        <div className='max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3'>
          <Link to='/' className='flex items-center gap-2 text-white'>
            <img src={logo} alt='Chukwu Patrick Ifeanyi' className='bg-primary rounded-full size-10' />
            <span className='font-medium'>Patrick Chukwu</span>
          </Link>
          <Link to='/' className='text-sm hover:text-white'>Portfolio</Link>
        </div>
      </header>
      <main className='max-w-6xl mx-auto px-4 py-6'>
        {session.loading ? <p>Loading…</p> : null}
        {!session.loading && session.error && !session.authenticated ? <Banner>{session.error}</Banner> : null}
        {!session.loading && !session.authenticated ? <Login onSuccess={() => setSession({ loading: false, authenticated: true })} /> : null}
        {session.authenticated ? (
          <>
            <div className='no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6'>
              <div>
                <p className='text-xs uppercase tracking-wide text-greylight'>Private</p>
                <h1 className='text-white text-2xl font-medium'>Invoices & receipts</h1>
              </div>
              <button type='button' className={secondaryButton} onClick={logout}>Log out</button>
            </div>
            <nav className='no-print flex gap-2 overflow-x-auto pb-4' aria-label='Billing'>
              {links.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/billing'} className={({ isActive }) => `shrink-0 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-primary text-black' : 'border border-bcolor text-secondary hover:text-white'}`}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <Outlet />
          </>
        ) : null}
      </main>
    </div>
  )
}
