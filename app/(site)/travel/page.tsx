import Link from 'next/link'

export const metadata = {
  title: 'Travel Deals | Halalzi',
  description: 'Search travel deals powered by Travelpayouts.',
}

export default function TravelServicePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <section className="rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 p-6 text-white md:p-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-100">New service</p>
        <h1 className="text-2xl font-bold md:text-4xl">Halalzi Travel</h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">
          Travelpayouts integration connected through our custom API layer. You can now wire flight/hotel search widgets
          without exposing private API credentials on the client.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 md:mt-8 md:p-7">
        <h2 className="text-lg font-semibold text-gray-900 md:text-xl">API endpoint</h2>
        <p className="mt-2 text-sm text-gray-600">
          Use the internal endpoint from frontend or server components:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 md:text-sm">
          {`GET /api/travelpayouts/search?endpoint=/v1/prices/cheap&origin=DAC&destination=DXB&depart_date=2026-06&currency=usd`}
        </pre>
        <p className="mt-3 text-xs text-gray-500">
          Set `TRAVELPAYOUTS_API_TOKEN` and optional `TRAVELPAYOUTS_MARKER` in environment variables.
        </p>
      </section>

      <div className="mt-6">
        <Link href="/" className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          Back to home
        </Link>
      </div>
    </main>
  )
}
