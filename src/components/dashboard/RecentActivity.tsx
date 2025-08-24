import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Eye } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'upload' | 'export' | 'view';
  description: string;
  vendor: string;
  amount: number;
  timestamp: string;
  category: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload':
        return 'text-success';
      case 'export':
        return 'text-primary';
      case 'view':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Activité récente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dernières actions sur vos factures
          </p>
        </div>
        <Button variant="outline" size="sm">
          Voir tout
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {activity.vendor}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {activity.category}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {activity.amount.toFixed(2)}€
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};