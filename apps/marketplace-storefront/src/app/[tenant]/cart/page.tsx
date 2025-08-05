import CartClient from './cart-client'

interface CartPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function CartPage({ params }: CartPageProps) {
  const { tenant } = await params
  return <CartClient tenant={tenant} />
}
