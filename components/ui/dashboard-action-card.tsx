import { Card } from "@/components/ui/card";

export function DashboardActionCard({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-6 flex flex-col items-center justify-center hover:shadow-lg transition"
    >
      <div className="text-blue-600">{icon}</div>
      <p className="mt-3 text-center font-medium">{label}</p>
    </Card>
  );
}



