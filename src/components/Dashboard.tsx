import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, isDemoMode } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { InvoiceGallery } from "./InvoiceGallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExportSection } from "./ExportSection";
import { UploadZone } from "./UploadZone";
import { StatsCards } from "./dashboard/StatsCards";
import { InvoiceChart } from "./dashboard/InvoiceChart";
import { CategoryChart } from "./dashboard/CategoryChart";
import { RecentActivity } from "./dashboard/RecentActivity";
import { useRealTimeInvoices } from "@/hooks/useRealTimeInvoices";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Invoice {
  id: number;
  vendeur?: string;
  montant_ttc?: number;
  date?: string;
  created_at: string;
  numero_facture?: string;
  categorie?: string;
  articles_description?: string;
}

export const Dashboard = () => {
  const { toast } = useToast();
  
  // Utiliser le hook temps réel au lieu de la logique locale
  const { groupedInvoices, isLoading } = useRealTimeInvoices();

  // Convertir les factures groupées en format attendu par le dashboard
  const invoicesList = groupedInvoices;

  // Calculs pour les statistiques
  const totalInvoices = invoicesList.length;
  const totalAmount = invoicesList.reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0);
  const currentMonth = new Date().getMonth();
  const monthlyInvoices = invoicesList.filter(inv => 
    new Date(inv.created_at).getMonth() === currentMonth
  ).length;
  const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  // Données pour le graphique d'évolution (basées sur les vraies données)
  const chartData = totalInvoices > 0 ? [
    { month: 'Jan', count: 0, amount: 0 },
    { month: 'Fév', count: 0, amount: 0 },
    { month: 'Mar', count: 0, amount: 0 },
    { month: 'Avr', count: 0, amount: 0 },
    { month: 'Mai', count: 0, amount: 0 },
    { month: 'Juin', count: totalInvoices, amount: totalAmount }
  ] : [];

  // Données pour les catégories
  const categoryData = invoicesList.reduce((acc, invoice) => {
    const category = invoice.categorie || 'Autre';
    if (!acc[category]) {
      acc[category] = { category, count: 0, amount: 0 };
    }
    acc[category].count += 1;
    acc[category].amount += invoice.montant_ttc || 0;
    return acc;
  }, {} as Record<string, any>);

  const categoryChartData = Object.values(categoryData);

  // Activité récente (exemple avec les vraies factures)
  const recentActivities = invoicesList.slice(0, 5).map((invoice, index) => {
    const types: ('upload' | 'export' | 'view')[] = ['upload', 'export', 'view'];
    return {
      id: invoice.id.toString(),
      type: types[index % 3],
      description: `Facture ${invoice.numero_facture || invoice.id}`,
      vendor: invoice.vendeur || 'Vendeur inconnu',
      amount: invoice.montant_ttc || 0,
      timestamp: new Date(invoice.created_at).toLocaleDateString('fr-FR'),
      category: invoice.categorie || 'Autre'
    };
  });


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {isDemoMode && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Mode démo :</strong> Connectez Supabase pour accéder aux fonctionnalités complètes (authentification, stockage, upload de factures).
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gestion des factures
            </h1>
            <p className="text-muted-foreground">
              Uploadez, analysez et exportez vos factures facilement
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" disabled={isDemoMode}>
                <Upload className="h-5 w-5" />
                Uploader une facture
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Uploader une nouvelle facture</DialogTitle>
              </DialogHeader>
              <UploadZone />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistiques sur toute la largeur */}
            <StatsCards
              totalInvoices={totalInvoices}
              totalAmount={totalAmount}
              monthlyInvoices={monthlyInvoices}
              averageAmount={averageAmount}
            />

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceChart data={chartData} />
              <CategoryChart data={categoryChartData} />
            </div>

            {/* Activité récente en pleine largeur */}
            <RecentActivity activities={recentActivities} />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <InvoiceGallery />
          </TabsContent>

          <TabsContent value="export">
            <ExportSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};