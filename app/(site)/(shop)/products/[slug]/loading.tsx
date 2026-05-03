export default function ProductPageLoading() {
  return (
    <div className="bg-gray-50 py-8">
      <div
        className="w-full max-w-[1480px] mx-auto px-4 animate-pulse"
        aria-busy
        aria-label="Loading product"
      >
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="mx-auto h-[360px] w-full max-w-[600px] shrink-0 rounded-xl bg-gray-200 lg:mx-0" />
          <div className="min-w-0 w-full flex-1 space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="h-8 w-4/5 rounded bg-gray-200" />
            <div className="h-4 w-2/5 rounded bg-gray-200" />
            <div className="h-4 w-3/5 rounded bg-gray-200" />
            <div className="my-4 h-px w-full bg-gray-100" />
            <div className="h-10 w-full rounded-md bg-gray-200" />
            <div className="h-24 w-full rounded-md bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
