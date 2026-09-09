import LoginPanel from '@/components/social/login-panel';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <LoginPanel initialMode={mode === 'register' ? 'register' : 'login'}/>;
}
