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
          <img
            src={thumbnail}
            className="rounded-lg w-full h-40 object-cover"
          />
          <p className="text-sm text-gray-500 mt-2">{count} photos</p>
        </CardContent>
      </Card>
    </Link>
  );
}



