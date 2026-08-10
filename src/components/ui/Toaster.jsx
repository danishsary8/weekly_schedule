import { Toaster as HotToaster } from 'react-hot-toast'

/**
 * react-hot-toast restyled to the planner design system: ink card, cream text,
 * rounded-card corners, and a category-coloured left border per intent.
 */
export default function Toaster() {
  return (
    <HotToaster
      position="top-center"
      gutter={10}
      containerStyle={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      toastOptions={{
        duration: 3200,
        style: {
          background: '#1A1A1A',
          color: '#F5EDE6',
          borderRadius: '16px',
          borderLeft: '5px solid #8A8378',
          padding: '11px 15px',
          fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          maxWidth: '92vw',
          boxShadow: '0 14px 30px -10px rgba(26, 26, 26, 0.45)',
        },
        success: {
          style: { borderLeft: '5px solid #65A30D' },
          iconTheme: { primary: '#65A30D', secondary: '#1A1A1A' },
        },
        error: {
          style: { borderLeft: '5px solid #E11D48' },
          iconTheme: { primary: '#E11D48', secondary: '#1A1A1A' },
        },
        loading: {
          style: { borderLeft: '5px solid #0F766E' },
          iconTheme: { primary: '#0F766E', secondary: '#1A1A1A' },
        },
      }}
    />
  )
}
