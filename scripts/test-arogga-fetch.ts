async function testAroggaFetch() {
    const url = 'https://cdn2.arogga.com/eyJidW5kbGUiOiJmb3JjZS1kZWx1eGUiLCJpZCI6IjY0MjMxIiwic2l6ZSI6InN0YW5kYXJkIn0=.jpg' // Example URL structure
    // The one in screenshot is longer but looks similar

    // Let's use one from the screenshot as much as I can see
    const screenshotUrl = 'https://cdn2.arogga.com/eyJidW5kbGUiOmZhbHNlLCJpZCI6IjExMzc4MyIsInNpemUiOiI0MDAifQ==.jpg' // I'll try to guess/construct one

    console.log(`Fetching ${screenshotUrl}...`)

    try {
        const response = await fetch(screenshotUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        })

        console.log(`Status: ${response.status} ${response.statusText}`)
        console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

        if (response.ok) {
            const buffer = await response.arrayBuffer()
            console.log(`Success! Size: ${buffer.byteLength} bytes`)
        } else {
            const text = await response.text()
            console.log(`Error body: ${text.substring(0, 200)}`)
        }
    } catch (err) {
        console.error('Fetch error:', err)
    }
}

testAroggaFetch()
