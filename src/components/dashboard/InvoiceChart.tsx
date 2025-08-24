import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InvoiceChartProps {
  data: { month: string; count: number; amount: number }[];
}

export const InvoiceChart = ({ data }: InvoiceChartProps) => {
  // S'assurer qu'il y a toujours des données à afficher
  const chartData = data && data.length > 0 ? data : [
    { month: 'Jan', count: 0, amount: 0 },
    { month: 'Fév', count: 0, amount: 0 },
    { month: 'Mar', count: 0, amount: 0 },
    { month: 'Avr', count: 0, amount: 0 },
    { month: 'Mai', count: 0, amount: 0 },
    { month: 'Juin', count: 0, amount: 0 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution mensuelle</CardTitle>
        <p className="text-sm text-muted-foreground">
          Évolution de vos factures au fil du temps
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-primary">
                          Factures: {payload[0]?.value}
                        </p>
                        <p className="text-success">
                          Montant: {payload[1]?.value}€
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#countGradient)"
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                fill="url(#amountGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};