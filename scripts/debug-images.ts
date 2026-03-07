import { prisma } from '../lib/prisma'
import { supabaseAdmin } from '../lib/supabase'

async function debug() {
    const EXTERNAL_IMAGE_DOMAINS = ['chaldn.com', 'arogga.com', 'medeasy.health', 'othoba.com']

    console.log('--- Checking for products with external images ---')
    const products = await prisma.product.findMany({
        where: {
            OR: EXTERNAL_IMAGE_DOMAINS.map(domain => ({
                imageUrl: { contains: domain },
            })),
        },
        select: { id: true, name: true, imageUrl: true },
        take: 5,
    })

    console.log(`Found ${products.length} products to check.`)

    const bucket = process.env.SUPABASE_MEDICINE_BUCKET || 'medicine-images'
    console.log(`Target bucket: ${bucket}`)

    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
        console.error('Error listing buckets:', bucketError)
    } else {
        console.log('Available buckets:', buckets.map(b => b.name))
        const exists = buckets.some(b => b.name === bucket)
        console.log(`Bucket "${bucket}" exists: ${exists}`)
    }

    for (const product of products) {
        if (!product.imageUrl) continue;
        console.log(`\nTesting product: ${product.name} (${product.id})`)
        console.log(`URL: ${product.imageUrl}`)

        try {
            const response = await fetch(product.imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            })

            console.log(`Fetch status: ${response.status} ${response.statusText}`)
            if (response.ok) {
                const contentType = response.headers.get('content-type')
                console.log(`Content-Type: ${contentType}`)
                const arrayBuffer = await response.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                console.log(`Buffer size: ${buffer.length} bytes`)

                // Test upload
                const testPath = `debug/${product.id}-${Date.now()}.webp`
                const { data, error: uploadError } = await supabaseAdmin.storage
                    .from(bucket)
                    .upload(testPath, buffer, {
                        contentType: contentType || 'image/webp',
                        upsert: true
                    })

                if (uploadError) {
                    console.error(`Upload error: ${uploadError.message}`)
                } else {
                    console.log(`Upload success: ${data.path}`)
                    // Clean up
                    await supabaseAdmin.storage.from(bucket).remove([data.path])
                }
            } else {
                const text = await response.text()
                console.log(`Error body: ${text.substring(0, 100)}`)
            }
        } catch (err) {
            console.error('Fetch error:', err)
        }
    }
}

debug().catch(console.error)
