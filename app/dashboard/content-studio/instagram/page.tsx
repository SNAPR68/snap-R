import { redirect } from 'next/navigation'
export default function InstagramPage({ searchParams }: { searchParams: { listing?: string } }) {
  redirect(`/dashboard/content-studio/create-all?listing=${searchParams.listing || ''}`)
}
