import UnifiedAuthView from '../components/auth/UnifiedAuthView.jsx'

export default function LoginPage({ imageSrc }) {
  return <UnifiedAuthView initialMode="signin" imageSrc={imageSrc} />
}
