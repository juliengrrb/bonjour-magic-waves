import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, FileSpreadsheet, Archive, Clock, CheckCircle, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealTimeTva, TvaRecord } from "@/hooks/useRealTimeTva";

interface Invoice {
  id: number;
  vendeur?: string;
  montant_ttc?: number;
  date?: string;
  created_at: string;
  numero_facture?: string;
  tva_total?: number;
  mode_paiement?: string;
  categorie?: string;
  articles_description?: string;
  articles_quantite?: number;
  articles_totale?: number;
}

interface ExportData {
  count: number;
  totalAmount: number;
  invoices: string[];
}

interface TvaExportData {
  count: number;
  totalTTC: number;
  totalTva20: number;
  totalTva10: number;
  totalTva55: number;
  vendors: string[];
}

type ExportPeriod = 'today' | 'thisWeek' | 'thisMonth';
type ExportFormat = 'excel' | 'pdf' | 'zip';
type ExportType = 'invoices' | 'tva';

export const ExportSection = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('today');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [periodData, setPeriodData] = useState<Record<ExportPeriod, ExportData>>({
    today: { count: 0, totalAmount: 0, invoices: [] },
    thisWeek: { count: 0, totalAmount: 0, invoices: [] },
    thisMonth: { count: 0, totalAmount: 0, invoices: [] }
  });
  
  // TVA states
  const [tvaPeriodData, setTvaPeriodData] = useState<Record<ExportPeriod, TvaExportData>>({
    today: { count: 0, totalTTC: 0, totalTva20: 0, totalTva10: 0, totalTva55: 0, vendors: [] },
    thisWeek: { count: 0, totalTTC: 0, totalTva20: 0, totalTva10: 0, totalTva55: 0, vendors: [] },
    thisMonth: { count: 0, totalTTC: 0, totalTva20: 0, totalTva10: 0, totalTva55: 0, vendors: [] }
  });
  
  const { toast } = useToast();
  const { tvaRecords } = useRealTimeTva();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    calculateTvaPeriodData();
  }, [tvaRecords]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invoicesData = data as Invoice[];
      setInvoices(invoicesData);

      // Group invoices by invoice number and date to avoid counting article lines as separate invoices
      const groupedInvoices = invoicesData.reduce((acc, invoice) => {
        const key = `${invoice.numero_facture || invoice.id}-${invoice.date || invoice.created_at}`;
        if (!acc[key]) {
          acc[key] = {
            ...invoice,
            articles: []
          };
        }
        acc[key].articles.push(invoice);
        return acc;
      }, {} as Record<string, any>);

      const uniqueInvoices = Object.values(groupedInvoices);

      // Calculate periods data
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const calculatePeriodData = (filterFn: (invoice: any) => boolean) => {
        const filtered = uniqueInvoices.filter(filterFn);
        return {
          count: filtered.length,
          totalAmount: filtered.reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0),
          invoices: [...new Set(filtered.map(inv => inv.vendeur).filter(Boolean))]
        };
      };

      const newPeriodData = {
        today: calculatePeriodData(inv => 
          new Date(inv.created_at) >= todayStart
        ),
        thisWeek: calculatePeriodData(inv => 
          new Date(inv.created_at) >= weekStart
        ),
        thisMonth: calculatePeriodData(inv => 
          new Date(inv.created_at) >= monthStart
        )
      };

      setPeriodData(newPeriodData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive",
      });
    }
  };

  const calculateTvaPeriodData = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const calculateTvaData = (filterFn: (record: TvaRecord) => boolean) => {
      const filtered = tvaRecords.filter(filterFn);
      return {
        count: filtered.length,
        totalTTC: filtered.reduce((sum, record) => sum + (parseFloat(String(record.montant_ttc || '0')) || 0), 0),
        totalTva20: filtered.reduce((sum, record) => sum + (parseFloat(String(record.tva_20 || '0')) || 0), 0),
        totalTva10: filtered.reduce((sum, record) => sum + (parseFloat(String(record.tva_10 || '0')) || 0), 0),
        totalTva55: filtered.reduce((sum, record) => sum + (parseFloat(String(record.tva_5_5 || '0')) || 0), 0),
        vendors: [...new Set(filtered.map(record => record.vendeur).filter(Boolean))]
      };
    };

    const newTvaPeriodData = {
      today: calculateTvaData(record => 
        new Date(record.created_at) >= todayStart
      ),
      thisWeek: calculateTvaData(record => 
        new Date(record.created_at) >= weekStart
      ),
      thisMonth: calculateTvaData(record => 
        new Date(record.created_at) >= monthStart
      )
    };

    setTvaPeriodData(newTvaPeriodData);
  };

  const currentData = periodData[selectedPeriod];
  const currentTvaData = tvaPeriodData[selectedPeriod];

  const generateExportFile = (format: ExportFormat, data: Invoice[]) => {
    switch (format) {
      case 'excel':
        return generateExcelFile(data);
      case 'pdf':
        return generatePDFFile(data);
      case 'zip':
        return generateZipFile(data);
      default:
        return null;
    }
  };

  const generateExcelFile = (data: any[]) => {
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      'Date,Vendeur,TVA_Total,Montant_TTC,Mode_Paiement,Categorie,Numero_Facture,Articles_description,Articles_quantité,Articles_total',
      ...data.map(inv => 
        [
          escapeCSV(inv.date),
          escapeCSV(inv.vendeur),
          escapeCSV(inv.tva_total),
          escapeCSV(inv.montant_ttc),
          escapeCSV(inv.mode_paiement),
          escapeCSV(inv.categorie),
          escapeCSV(inv.numero_facture),
          escapeCSV(inv.articles_description),
          escapeCSV(inv.articles_quantite),
          escapeCSV(inv.articles_totale)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  };

  const generatePDFFile = (data: any[]) => {
    const htmlContent = `
      <html>
        <head>
          <title>Rapport Factures</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Rapport des Factures</h1>
          <p>Période: ${getPeriodLabel(selectedPeriod)}</p>
          <p>Total: ${currentData.totalAmount.toFixed(2)}€</p>
          <table>
            <tr>
              <th>Date</th><th>Vendeur</th><th>TVA Total</th><th>Montant TTC</th>
              <th>Mode Paiement</th><th>Catégorie</th><th>N° Facture</th>
              <th>Articles</th><th>Quantité</th><th>Total Articles</th>
            </tr>
            ${data.map(inv => `
              <tr>
                <td>${inv.date || ''}</td>
                <td>${inv.vendeur || ''}</td>
                <td>${inv.tva_total || ''}€</td>
                <td>${inv.montant_ttc || ''}€</td>
                <td>${inv.mode_paiement || ''}</td>
                <td>${inv.categorie || ''}</td>
                <td>${inv.numero_facture || ''}</td>
                <td>${inv.articles_description || ''}</td>
                <td>${inv.articles_quantite || ''}</td>
                <td>${inv.articles_totale || ''}€</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  };

  const generateZipFile = (data: Invoice[]) => {
    const content = `Factures exportées: ${data.length} factures pour un total de ${currentData.totalAmount.toFixed(2)}€`;
    const blob = new Blob([content], { type: 'text/plain' });
    return blob;
  };

  // TVA Export functions
  const generateTvaExportFile = (format: ExportFormat, data: TvaRecord[]) => {
    switch (format) {
      case 'excel':
        return generateTvaExcelFile(data);
      case 'pdf':
        return generateTvaPDFFile(data);
      case 'zip':
        return generateTvaZipFile(data);
      default:
        return null;
    }
  };

  const generateTvaExcelFile = (data: TvaRecord[]) => {
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Calculate totals
    const totalTTC = data.reduce((sum, record) => sum + (parseFloat(String(record.montant_ttc || '0')) || 0), 0);
    const totalTva20 = data.reduce((sum, record) => sum + (parseFloat(String(record.tva_20 || '0')) || 0), 0);
    const totalTva10 = data.reduce((sum, record) => sum + (parseFloat(String(record.tva_10 || '0')) || 0), 0);
    const totalTva55 = data.reduce((sum, record) => sum + (parseFloat(String(record.tva_5_5 || '0')) || 0), 0);

    const csvContent = [
      'Date,Numero_Facture,Vendeur,Montant_TTC,TVA_20,TVA_10,TVA_5_5',
      ...data.map(record => 
        [
          escapeCSV(record.date),
          escapeCSV(record.numero_facture),
          escapeCSV(record.vendeur),
          escapeCSV(record.montant_ttc),
          escapeCSV(record.tva_20),
          escapeCSV(record.tva_10),
          escapeCSV(record.tva_5_5)
        ].join(',')
      ),
      // Add totals row
      `TOTAL,,,"${totalTTC.toFixed(2)}","${totalTva20.toFixed(2)}","${totalTva10.toFixed(2)}","${totalTva55.toFixed(2)}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  };

  const generateTvaPDFFile = (data: TvaRecord[]) => {
    const totalTTC = data.reduce((sum, record) => sum + (parseFloat(String(record.montant_ttc || '0')) || 0), 0);
    const totalTva20 = data.reduce((sum, record) => sum + (parseFloat(String(record.tva_20 || '0')) || 0), 0);
    const totalTva10 = data.reduce((sum, record) => sum + (parseFloat(String(record.tva_10 || '0')) || 0), 0);
    const totalTva55 = data.reduce((sum, record) => sum + (parseFloat(String(record.tva_5_5 || '0')) || 0), 0);

    const htmlContent = `
      <html>
        <head>
          <title>Rapport TVA</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Rapport TVA</h1>
          <p>Période: ${getPeriodLabel(selectedPeriod)}</p>
          <p>Total TTC: ${totalTTC.toFixed(2)}€</p>
          <table>
            <tr>
              <th>Date</th><th>N° Facture</th><th>Vendeur</th><th>Montant TTC</th>
              <th>TVA 20%</th><th>TVA 10%</th><th>TVA 5.5%</th>
            </tr>
            ${data.map(record => `
              <tr>
                <td>${record.date || ''}</td>
                <td>${record.numero_facture || ''}</td>
                <td>${record.vendeur || ''}</td>
                <td>${(parseFloat(String(record.montant_ttc || '0')) || 0).toFixed(2)}€</td>
                <td>${(parseFloat(String(record.tva_20 || '0')) || 0).toFixed(2)}€</td>
                <td>${(parseFloat(String(record.tva_10 || '0')) || 0).toFixed(2)}€</td>
                <td>${(parseFloat(String(record.tva_5_5 || '0')) || 0).toFixed(2)}€</td>
              </tr>
            `).join('')}
            <tr class="totals">
              <td colspan="3"><strong>TOTAL</strong></td>
              <td><strong>${totalTTC.toFixed(2)}€</strong></td>
              <td><strong>${totalTva20.toFixed(2)}€</strong></td>
              <td><strong>${totalTva10.toFixed(2)}€</strong></td>
              <td><strong>${totalTva55.toFixed(2)}€</strong></td>
            </tr>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  };

  const generateTvaZipFile = (data: TvaRecord[]) => {
    const content = `TVA exportée: ${data.length} enregistrements pour un total TTC de ${currentTvaData.totalTTC.toFixed(2)}€`;
    const blob = new Blob([content], { type: 'text/plain' });
    return blob;
  };

  const handleExport = async (exportType: 'invoices' | 'tva' = 'invoices') => {
    setIsExporting(true);
    
    try {
      // Get filtered data for the selected period
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'thisWeek':
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      let blob: Blob | null = null;
      let filename = '';
      let itemCount = 0;

      if (exportType === 'invoices') {
        const filteredInvoices = invoices.filter(inv => 
          new Date(inv.created_at) >= startDate
        );
        blob = generateExportFile(selectedFormat, filteredInvoices);
        itemCount = currentData.count;
        const extension = selectedFormat === 'excel' ? 'csv' : selectedFormat === 'pdf' ? 'html' : 'txt';
        filename = `factures_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.${extension}`;
      } else {
        const filteredTva = tvaRecords.filter(record => 
          new Date(record.created_at) >= startDate
        );
        blob = generateTvaExportFile(selectedFormat, filteredTva);
        itemCount = currentTvaData.count;
        const extension = selectedFormat === 'excel' ? 'csv' : selectedFormat === 'pdf' ? 'html' : 'txt';
        filename = `tva_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.${extension}`;
      }
      
      if (blob) {
        // Create download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export réussi",
          description: `${itemCount} ${exportType === 'invoices' ? 'factures' : 'enregistrements TVA'} exportés au format ${selectedFormat.toUpperCase()}`,
        });
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getPeriodLabel = (period: ExportPeriod) => {
    switch (period) {
      case 'today':
        return "Aujourd'hui";
      case 'thisWeek':
        return "Cette semaine";
      case 'thisMonth':
        return "Ce mois";
      default:
        return period;
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <Download className="h-4 w-4" />;
      case 'zip':
        return <Archive className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exports
          </CardTitle>
          <CardDescription>
            Téléchargez vos données par période pour transmission à votre comptable
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Period & Format Selection (Shared) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration globale</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Période d'export</label>
            <Select value={selectedPeriod} onValueChange={(value: ExportPeriod) => setSelectedPeriod(value)}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="thisWeek">Cette semaine</SelectItem>
                <SelectItem value="thisMonth">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Format d'export</label>
            <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
              <SelectTrigger>
                {getFormatIcon(selectedFormat)}
                <SelectValue className="ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                <SelectItem value="zip">Archive ZIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Two Export Sections Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FACTURES Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Export Factures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Factures Preview */}
            <Card className="bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Aperçu - {getPeriodLabel(selectedPeriod)}
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{currentData.count}</div>
                    <div className="text-xs text-muted-foreground">Factures</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-success">{currentData.totalAmount.toFixed(2)}€</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium">Magasins ({currentData.invoices.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {currentData.invoices.slice(0, 3).map((store, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {store}
                      </Badge>
                    ))}
                    {currentData.invoices.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentData.invoices.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factures Export Button */}
            <Button 
              onClick={() => handleExport('invoices')} 
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  {getFormatIcon(selectedFormat)}
                  <span className="ml-2">
                    Exporter {currentData.count} factures
                  </span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* TVA Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-accent" />
              Export TVA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TVA Preview */}
            <Card className="bg-gradient-to-r from-accent/5 to-warning/5 border-accent/20">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Aperçu TVA - {getPeriodLabel(selectedPeriod)}
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-accent">{currentTvaData.count}</div>
                    <div className="text-xs text-muted-foreground">Lignes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-success">{currentTvaData.totalTTC.toFixed(2)}€</div>
                    <div className="text-xs text-muted-foreground">TTC Total</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-background rounded">
                      <div className="font-bold text-red-600">{currentTvaData.totalTva20.toFixed(2)}€</div>
                      <div className="text-muted-foreground">TVA 20%</div>
                    </div>
                    <div className="text-center p-2 bg-background rounded">
                      <div className="font-bold text-orange-600">{currentTvaData.totalTva10.toFixed(2)}€</div>
                      <div className="text-muted-foreground">TVA 10%</div>
                    </div>
                    <div className="text-center p-2 bg-background rounded">
                      <div className="font-bold text-green-600">{currentTvaData.totalTva55.toFixed(2)}€</div>
                      <div className="text-muted-foreground">TVA 5.5%</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">Vendeurs ({currentTvaData.vendors.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {currentTvaData.vendors.slice(0, 2).map((vendor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {vendor}
                        </Badge>
                      ))}
                      {currentTvaData.vendors.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{currentTvaData.vendors.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TVA Export Button */}
            <Button 
              onClick={() => handleExport('tva')} 
              disabled={isExporting}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isExporting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  {getFormatIcon(selectedFormat)}
                  <span className="ml-2">
                    Exporter {currentTvaData.count} lignes TVA
                  </span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-warning/5 border-warning/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 rounded-full bg-warning/10">
              <FileSpreadsheet className="h-5 w-5 text-warning" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Formats d'export disponibles</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Excel (.csv):</strong> Données tabulaires avec totaux automatiques</p>
                <p><strong>PDF (.html):</strong> Rapport complet avec tableaux formatés</p>
                <p><strong>ZIP (.txt):</strong> Archive avec résumé des données</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};