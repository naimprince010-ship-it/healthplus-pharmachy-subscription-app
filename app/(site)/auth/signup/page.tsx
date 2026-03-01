import { redirect } from 'next/navigation'

export default function SignUpPage() {
  redirect('/auth/signin?message=Please+login+or+register+using+your+phone+number')
}
