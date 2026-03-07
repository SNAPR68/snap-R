import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ListingCard({
  id,
  title,
  thumbnail,
  count,
}: {
  id: string;
  title: string;
  thumbnail: string;
  count: number;
}) {
  return (
    <Link href={`/listings/${id}`}>
      <Card className="hover:shadow-lg transition">
        <CardHeader>
          <CardTitle className="truncate">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Image
            src={thumbnail}
            alt={title}
            width={400}
            height={160}
            className="rounded-lg w-full h-40 object-cover"
            unoptimized
          />
          <p className="text-sm text-[var(--text-soft)] mt-2">{count} photos</p>
        </CardContent>
      </Card>
    </Link>
  );
}



