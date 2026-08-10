import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { useAuthStore } from '../store/authStore.js'
export default function EmailVerifiedPage(){const refresh=useAuthStore(s=>s.refreshUser),status=useAuthStore(s=>s.status);useEffect(()=>{if(status==='authenticated')refresh().catch(()=>{})},[refresh,status]);return <AuthLayout title="Email verified" subtitle="Your Daycraft account is ready."><div className="rounded-2xl bg-career/10 p-5 text-center font-sans text-sm text-ink/70 ring-1 ring-career/20"><p>You can now create and update your routines.</p><Link to="/" className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-ink px-5 font-bold text-white">Open Daycraft</Link></div></AuthLayout>}
