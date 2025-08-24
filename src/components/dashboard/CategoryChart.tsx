import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryChartProps {
  data: { category: string; count: number; amount: number }[];
}

export const CategoryChart = ({ data }: CategoryChartProps) => {
  const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))', '#06B6D4'];
  
  // S'assurer qu'il y a des données par défaut pour l'affichage
  const chartData = data && data.length > 0 ? data : [
    { category: 'Aucune donnée', count: 1, amount: 0 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par catégorie</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribution de vos dépenses
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="amount"
                nameKey="category"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.category}</p>
                        <p className="text-primary">
                          {data.count} facture{data.count > 1 ? 's' : ''}
                        </p>
                        <p className="text-success">
                          {data.amount.toFixed(2)}€
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};