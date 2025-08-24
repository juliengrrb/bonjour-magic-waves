import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, Euro, Calendar } from "lucide-react";

interface StatsCardsProps {
  totalInvoices: number;
  totalAmount: number;
  monthlyInvoices: number;
  averageAmount: number;
}

export const StatsCards = ({ totalInvoices, totalAmount, monthlyInvoices, averageAmount }: StatsCardsProps) => {
  const stats = [
    {
      title: "Total des factures",
      value: totalInvoices.toString(),
      icon: FileText,
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Montant total",
      value: `${totalAmount.toFixed(2)}€`,
      icon: Euro,
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Ce mois",
      value: monthlyInvoices.toString(),
      icon: Calendar,
      trend: "+23%",
      trendUp: true
    },
    {
      title: "Moyenne",
      value: `${averageAmount.toFixed(2)}€`,
      icon: TrendingUp,
      trend: "+15%",
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{/* Réduit l'espacement */}
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">{/* Réduit le padding */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold mt-1">{stat.value}</p>{/* Réduit la taille */}
                <div className="flex items-center mt-1">
                  <span className={`text-xs font-medium ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">vs mois dernier</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <stat.icon className="h-4 w-4 text-primary" />{/* Réduit la taille de l'icône */}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};