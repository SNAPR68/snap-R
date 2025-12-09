import { redirect } from 'next/navigation'
export default function TikTokPage({ searchParams }: { searchParams: { listing?: string } }) {
  redirect(`/dashboard/content-studio/create-all?listing=${searchParams.listing || ''}`)
}
