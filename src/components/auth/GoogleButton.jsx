import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchGoogleRedirectUrl } from '../../api/services.js'
export default function GoogleButton({ onError }) {
  const [loading,setLoading]=useState(false)
  const start=async()=>{setLoading(true);try{const data=await fetchGoogleRedirectUrl();window.location.assign(data.url)}catch(error){setLoading(false);onError?.(error.message||'Google sign-in is unavailable.')}}
  return <><div className="my-5 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-black/10"/><span className="font-sans text-label font-bold uppercase tracking-widest text-ink/35">or</span><span className="h-px flex-1 bg-black/10"/></div><button type="button" onClick={start} disabled={loading} className="flex min-h-touch-lg w-full items-center justify-center gap-3 rounded-xl bg-white px-4 font-sans text-sm font-bold text-ink ring-1 ring-black/15 transition-colors hover:bg-cream/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-career disabled:cursor-wait disabled:opacity-60">{loading?<Loader2 className="h-5 w-5 animate-spin"/>:<img src="/google-g.svg" alt="" className="h-5 w-5"/>}{loading?'Connecting to Google…':'Continue with Google'}</button></>
}
