import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../assets/Patrick.png'
import { SIGNED_OUT_EVENT, api } from './api.js'
import { Banner, inputClass, primaryButton, secondaryButton } from './ui.jsx'

const links = [
  ['/billing', 'Dashboard'],
  ['/billing/invoices', 'Invoices'],
  ['/billing/clients', 'Clients'],
  ['/billing/receipts', 'Receipts'],
  ['/billing/settings', 'Settings'],
]

function Login({ onSuccess, notice }) {
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const input = useRef(null)
  useEffect(() => {
    input.current?.focus()
  }, [])
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    if (!password) {
      setError('Enter the admin password.')
      input.current?.focus()
      return
    }
    setPending(true)
    setError('')
    try {
      await api('/api/billing/login', { method: 'POST', body: { password } })
      setPassword('')
      onSuccess()
    } catch (err) {
      setError(err.code === 'UNAUTHENTICATED' ? 'Incorrect password. Check it and try again.' : err.message)
      input.current?.focus()
    } finally {
      setPending(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate aria-labelledby='billing-login-title' className='w-full max-w-md mx-auto mt-6 sm:mt-10 flex flex-col gap-4 border border-bcolor rounded-lg p-5 sm:p-6'>
      <div className='flex flex-col gap-1'>
        <p className='text-xs uppercase tracking-wide text-greylight'>Private</p>
        <h1 id='billing-login-title' className='text-white text-2xl font-medium'>Billing administration</h1>
        <p className='text-sm text-secondary'>Sign in to manage invoices, payments, and receipts. This area is not part of the public site.</p>
      </div>
      {notice ? <Banner>{notice}</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      <div className='flex flex-col gap-1 text-sm text-secondary'>
        <label htmlFor='billing-password'>Admin password</label>
        <div className='relative'>
          <input
            id='billing-password'
            ref={input}
            className={`${inputClass} w-full pr-16`}
            type={visible ? 'text' : 'password'}
            name='password'
            autoComplete='current-password'
            autoCapitalize='none'
            spellCheck={false}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? 'true' : undefined}
            readOnly={pending}
            required
          />
          <button
            type='button'
            onClick={() => setVisible((value) => !value)}
            aria-pressed={visible}
            aria-controls='billing-password'
            className='absolute inset-y-0 right-0 px-3 text-xs text-secondary hover:text-white rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          >
            {visible ? 'Hide' : 'Show'}
            <span className='sr-only'> password</span>
          </button>
        </div>
      </div>
      <button className={primaryButton} type='submit' disabled={pending} aria-busy={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}

export default function BillingLayout() {
  const navigate = useNavigate()
  const [session, setSession] = useState({ loading: true, authenticated: false })
  const [attempt, setAttempt] = useState(0)
  const [logoutError, setLogoutError] = useState('')
  const [signedOutNotice, setSignedOutNotice] = useState('')
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
    setSession({ loading: true, authenticated: false })
    api('/api/billing/session').then((payload) => {
      if (active) setSession({ loading: false, authenticated: payload.authenticated })
    }).catch((error) => {
      if (active) setSession({ loading: false, authenticated: false, error: error.message, code: error.code })
    })
    return () => { active = false }
  }, [attempt])
  useEffect(() => {
    const onSignedOut = () => {
      setSignedOutNotice('Your session has ended. Sign in again to continue.')
      setSession({ loading: false, authenticated: false })
    }
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut)
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut)
  }, [])
  const signedIn = useCallback(() => {
    setSignedOutNotice('')
    setLogoutError('')
    setSession({ loading: false, authenticated: true })
  }, [])
  async function logout() {
    setLogoutError('')
    try {
      await api('/api/billing/logout', { method: 'POST' })
    } catch (error) {
      setLogoutError(`${error.message} You are still signed in.`)
      return
    }
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
        {session.loading ? <p role='status' className='text-secondary text-center mt-10'>Verifying your session…</p> : null}
        {!session.loading && !session.authenticated && session.error ? (
          <div className='max-w-md mx-auto mt-6 sm:mt-10 flex flex-col gap-3'>
            <Banner>{session.error}</Banner>
            {session.code !== 'NOT_CONFIGURED' ? (
              <button type='button' className={secondaryButton} onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            ) : null}
          </div>
        ) : null}
        {!session.loading && !session.authenticated && !session.error ? <Login onSuccess={signedIn} notice={signedOutNotice} /> : null}
        {session.authenticated ? (
          <>
            <div className='no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6'>
              <div>
                <p className='text-xs uppercase tracking-wide text-greylight'>Private</p>
                <h1 className='text-white text-2xl font-medium'>Billing administration</h1>
              </div>
              <button type='button' className={secondaryButton} onClick={logout}>Log out</button>
            </div>
            {logoutError ? <div className='mb-4'><Banner>{logoutError}</Banner></div> : null}
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
