import { redirect } from 'next/navigation'

export default function MembershipRedirect() {
  redirect('/admin/memberships')
}
