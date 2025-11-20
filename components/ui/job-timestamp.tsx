"use client";

export default function JobTimestamp({ date }: { date: string }) {
  return <>{new Date(date).toLocaleString()}</>;
}

