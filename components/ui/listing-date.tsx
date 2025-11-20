"use client";

export default function ListingDate({ date }: { date: string }) {
  return <>{new Date(date).toLocaleDateString()}</>;
}

