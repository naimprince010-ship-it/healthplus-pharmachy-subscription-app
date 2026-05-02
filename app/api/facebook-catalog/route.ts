import { prisma } from '@/lib/prisma'
import { resolveFacebookImageUrl } from '@/lib/facebook-marketing'
import { getEffectivePrices } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com'

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        brandName: true,
        sellingPrice: true,
        mrp: true,
        stockQuantity: true,
        imageUrl: true,
        discountPercentage: true,
        campaignPrice: true,
        campaignStart: true,
        campaignEnd: true,
      },
    })

    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        productId: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        brandName: true,
        genericName: true,
        sellingPrice: true,
        mrp: true,
        stockQuantity: true,
        imageUrl: true,
        discountPercentage: true,
      },
    })

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Halalzi Product Catalog</title>
    <link>${siteUrl}</link>
    <description>Official dynamic product feed for Facebook Catalog and Meta Pixel matching from Halalzi.</description>
`

    // Add Product Items
    products.forEach((p) => {
      const pUrl = `${siteUrl}/products/${p.slug}`
      const pImage = resolveFacebookImageUrl(p.imageUrl, siteUrl) || `${siteUrl}/images/default-product.png`

      const priceInfo = getEffectivePrices({
        sellingPrice: Number(p.sellingPrice),
        mrp: p.mrp != null ? Number(p.mrp) : null,
        discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
        campaignPrice: p.campaignPrice != null ? Number(p.campaignPrice) : null,
        campaignStart: p.campaignStart,
        campaignEnd: p.campaignEnd,
      })

      const cleanedDesc = (p.description || p.name)
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/[<&]/g, (match) => match === '&' ? '&amp;' : '&lt;')
        .substring(0, 5000)

      xml += `    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${cleanedDesc}]]></g:description>
      <g:link>${pUrl}</g:link>
      <g:image_link>${pImage}</g:image_link>
      <g:brand><![CDATA[${p.brandName || 'Halalzi'}]]></g:brand>
      <g:availability>${p.stockQuantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceInfo.price.toFixed(2)} BDT</g:price>
      <g:condition>new</g:condition>
    </item>\n`
    })

    // Add Medicine Items
    medicines.forEach((m) => {
      const mUrl = `${siteUrl}/medicines/${m.slug}`
      const mImage = resolveFacebookImageUrl(m.imageUrl, siteUrl) || `${siteUrl}/images/default-product.png`

      const priceInfo = getEffectivePrices({
        sellingPrice: Number(m.sellingPrice),
        mrp: m.mrp != null ? Number(m.mrp) : null,
        discountPercentage: m.discountPercentage != null ? Number(m.discountPercentage) : null,
      })

      const mDesc = m.description || (m.genericName ? `Generic Name: ${m.genericName}` : m.name)
      const cleanedDesc = mDesc
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/[<&]/g, (match) => match === '&' ? '&amp;' : '&lt;')
        .substring(0, 5000)

      xml += `    <item>
      <g:id>${m.id}</g:id>
      <g:title><![CDATA[${m.name}]]></g:title>
      <g:description><![CDATA[${cleanedDesc}]]></g:description>
      <g:link>${mUrl}</g:link>
      <g:image_link>${mImage}</g:image_link>
      <g:brand><![CDATA[${m.brandName || 'Halalzi'}]]></g:brand>
      <g:availability>${m.stockQuantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceInfo.price.toFixed(2)} BDT</g:price>
      <g:condition>new</g:condition>
    </item>\n`
    })

    xml += `  </channel>
</rss>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    })
  } catch (err: any) {
    console.error('Error generating Facebook Catalog feed:', err)
    return new Response('Error generating feed', { status: 500 })
  }
}
