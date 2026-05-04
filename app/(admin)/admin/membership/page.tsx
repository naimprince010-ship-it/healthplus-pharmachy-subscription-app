import { redirect } from 'next/navigation'

/**
 * Canonical membership plan admin is `/admin/memberships` (sidebar).
 * This route keeps old bookmarks and dashboard links working.
 */
export default function MembershipRedirectPage() {
  redirect('/admin/memberships')
}
