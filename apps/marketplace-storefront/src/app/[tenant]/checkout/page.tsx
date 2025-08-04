import CheckoutClient from './checkout-client'

interface CheckoutPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { tenant } = await params
  return <CheckoutClient tenant={tenant} />
}
