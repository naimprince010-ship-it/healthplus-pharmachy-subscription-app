/**
 * Next.js 16 App Router Page Props Types
 * 
 * In Next.js 16, params and searchParams in page components are Promises.
 * Use these types to ensure correct typing for all page components.
 */

/**
 * Type for page components that receive searchParams (e.g., list pages with filters)
 * 
 * @example
 * ```tsx
 * export default async function OrdersPage({
 *   searchParams,
 * }: PageSearchParams<{ status?: string }>) {
 *   const { status } = await searchParams
 *   // Use status...
 * }
 * ```
 */
export type PageSearchParams<T extends Record<string, string | string[] | undefined>> = {
  searchParams: Promise<T>
}

/**
 * Type for page components with dynamic route params (e.g., [id] routes)
 * 
 * @example
 * ```tsx
 * export default async function EditPage({
 *   params,
 * }: PageParams<{ id: string }>) {
 *   const { id } = await params
 *   // Use id...
 * }
 * ```
 */
export type PageParams<T extends Record<string, string>> = {
  params: Promise<T>
}

/**
 * Type for page components with both params and searchParams
 * 
 * @example
 * ```tsx
 * export default async function UserOrdersPage({
 *   params,
 *   searchParams,
 * }: PageParamsAndSearchParams<{ userId: string }, { status?: string }>) {
 *   const { userId } = await params
 *   const { status } = await searchParams
 *   // Use userId and status...
 * }
 * ```
 */
export type PageParamsAndSearchParams<
  P extends Record<string, string>,
  S extends Record<string, string | string[] | undefined>
> = {
  params: Promise<P>
  searchParams: Promise<S>
}

/**
 * Helper function to resolve both params and searchParams at once
 * 
 * @example
 * ```tsx
 * export default async function Page(props: PageParamsAndSearchParams<{ id: string }, { tab?: string }>) {
 *   const { params, searchParams } = await resolvePageProps(props)
 *   // Use params.id and searchParams.tab...
 * }
 * ```
 */
export async function resolvePageProps<
  P extends Record<string, string>,
  S extends Record<string, string | string[] | undefined>
>(props: {
  params?: Promise<P>
  searchParams?: Promise<S>
}): Promise<{
  params: P | undefined
  searchParams: S | undefined
}> {
  const [params, searchParams] = await Promise.all([
    props.params || Promise.resolve(undefined),
    props.searchParams || Promise.resolve(undefined),
  ])

  return { params, searchParams }
}
