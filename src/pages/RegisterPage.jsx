import UnifiedAuthView from '../components/auth/UnifiedAuthView.jsx'

export default function RegisterPage({ imageSrc }) {
  return <UnifiedAuthView initialMode="signup" imageSrc={imageSrc} />
}
