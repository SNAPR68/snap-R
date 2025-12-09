import { redirect } from 'next/navigation'
export default function LinkedInPage({ searchParams }: { searchParams: { listing?: string } }) {
  redirect(`/dashboard/content-studio/create-all?listing=${searchParams.listing || ''}`)
}
