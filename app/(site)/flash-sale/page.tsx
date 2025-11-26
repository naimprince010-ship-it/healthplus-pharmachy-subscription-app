import { Metadata } from 'next'
import FlashSalePage from '@/components/FlashSalePage'

export const metadata: Metadata = {
  title: 'Flash Sale – Halalzi',
  description: 'Grab amazing deals on medicines and healthcare products during our flash sale. Limited time offers with huge discounts!',
  keywords: 'flash sale, medicine deals, healthcare discounts, pharmacy offers, limited time deals',
  openGraph: {
    title: 'Flash Sale – Halalzi',
    description: 'Grab amazing deals on medicines and healthcare products during our flash sale. Limited time offers with huge discounts!',
    type: 'website',
  },
}

export default function FlashSale() {
  return <FlashSalePage />
}
