import AccountClient from './account-client'

interface AccountPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { tenant } = await params

  return <AccountClient tenant={tenant} />
}
