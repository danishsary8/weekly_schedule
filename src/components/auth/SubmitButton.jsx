import { Loader2 } from 'lucide-react'

export default function SubmitButton({ children, loading = false, disabled = false }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="button-brutal button-brutal-primary min-h-touch-lg w-full gap-2 px-4 text-sm focus-visible:ring-offset-paper"
    >
      {loading && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
