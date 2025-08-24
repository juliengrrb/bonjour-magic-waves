import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Calendar, Eye, Download, Filter, Folder, Receipt, Trash2, Edit, MoreVertical, Loader2, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useRealTimeInvoices } from "@/hooks/useRealTimeInvoices";
import { ProcessingIndicator } from "@/components/ProcessingIndicator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categoryColors = {
  "Grand Frais": "secondary",
  "Metro": "outline", 
  "Pharmacie": "secondary",
  "Monoprix": "destructive",
  "Carrefour": "secondary",
  "Autres": "outline"
} as const;

interface InvoiceGalleryProps {
  selectedInvoiceId?: string | null;
}

export const InvoiceGallery = ({ selectedInvoiceId }: InvoiceGalleryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  const { 
    groupedInvoices: groupedInvoicesData, 
    isLoading, 
    processingInvoices, 
    deleteInvoice, 
    updateInvoice 
  } = useRealTimeInvoices();

  // Get unique categories and dates from grouped invoices
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(groupedInvoicesData.map(invoice => invoice.categorie).filter(Boolean)));
    return uniqueCategories;
  }, [groupedInvoicesData]);

  const dates = useMemo(() => {
    const uniqueDates = Array.from(new Set(groupedInvoicesData.map(invoice => {
      return new Date(invoice.created_at).toLocaleDateString('fr-FR');
    })));
    return uniqueDates.sort().reverse();
  }, [groupedInvoicesData]);

  // Filter grouped invoices based on search term, category, and date
  const filteredInvoices = useMemo(() => {
    return groupedInvoicesData.filter(invoice => {
      const searchableText = [
        ...invoice.articles.map((a: any) => a.description),
        invoice.vendeur,
        invoice.categorie
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || invoice.categorie === selectedCategory;
      const invoiceDate = new Date(invoice.created_at).toLocaleDateString('fr-FR');
      const matchesDate = selectedDate === "all" || invoiceDate === selectedDate;
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [searchTerm, selectedCategory, selectedDate, groupedInvoicesData]);

  // Group filtered invoices by date
  const groupedInvoices = useMemo(() => {
    const groups = filteredInvoices.reduce((acc: any, invoice) => {
      const date = new Date(invoice.created_at).toLocaleDateString('fr-FR');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(invoice);
      return acc;
    }, {});

    // Sort groups by date (most recent first)
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => new Date(b.split('/').reverse().join('-')).getTime() - new Date(a.split('/').reverse().join('-')).getTime())
      .reduce((acc: any, date) => {
        acc[date] = groups[date];
        return acc;
      }, {});

    return sortedGroups;
  }, [filteredInvoices]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryBadgeVariant = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || "outline";
  };

  const handleDeleteInvoice = async (invoice: any) => {
    await deleteInvoice(invoice.image_url);
  };

  const handleUpdateInvoice = async (invoice: any) => {
    await updateInvoice(invoice.image_url, invoice);
    setEditingInvoice(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="chart-container-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Folder className="h-6 w-6 text-primary glow-pulse" />
            Galerie des Factures Premium
          </CardTitle>
          <CardDescription className="text-base">
            Parcourez et organisez toutes vos factures avec traitement IA en temps réel
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Advanced Filters */}
      <Card className="chart-container-premium">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-primary/20 focus:border-primary/50"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-primary/20 focus:border-primary/50">
                <Filter className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="glass-blur border border-primary/20">
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="border-primary/20 focus:border-primary/50">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent className="glass-blur border border-primary/20">
                <SelectItem value="all">Toutes les dates</SelectItem>
                {dates.map(date => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedDate("all");
              }}
              className="border-primary/20 hover:bg-primary/10"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {filteredInvoices.length} facture(s) trouvée(s)
          </p>
          {categories.map(category => (
            <Badge
              key={category}
              variant={getCategoryBadgeVariant(category)}
              className="hover:scale-105 transition-transform"
            >
              {category}
            </Badge>
          ))}
        </div>
        
        {processingInvoices.size > 0 && (
          <Badge variant="secondary" className="animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {processingInvoices.size} en cours de traitement
          </Badge>
        )}
      </div>

      {/* Invoice Gallery */}
      <div className="space-y-8">
        {/* Processing Invoices */}
        {Array.from(processingInvoices).map((imageUrl) => (
          <div key={`processing-${imageUrl}`} className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-primary/20">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <h3 className="text-lg font-semibold">Traitement IA en cours...</h3>
              <Badge variant="secondary" className="ml-auto animate-pulse bg-primary/20 text-primary">
                OCR & Analyse
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <ProcessingIndicator imageUrl={imageUrl} isProcessing={true} />
            </div>
          </div>
        ))}

        {/* Grouped Invoices by Date */}
        {Object.entries(groupedInvoices).map(([date, invoices]: [string, any[]]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{date}</h3>
              <Badge variant="secondary" className="ml-auto bg-success/20 text-success">
                {invoices.length} facture(s)
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {invoices.map((invoice: any) => (
                <Dialog key={invoice.id} onOpenChange={(open) => {
                  if (open) setSelectedInvoice(invoice);
                }}>
                  <DialogTrigger asChild>
                    <Card className="invoice-card-premium group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="aspect-[3/4] bg-muted rounded-lg mb-3 overflow-hidden relative">
                          {invoice.image_url ? (
                            <img 
                              src={invoice.image_url} 
                              alt={invoice.vendeur || 'Facture'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center">
                              <Receipt className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate flex-1">
                              {invoice.articles?.length > 0 ? invoice.articles[0].description : invoice.vendeur || 'Facture sans description'}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-blur border border-primary/20">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingInvoice(invoice);
                                  }} className="hover:bg-primary/10">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-destructive hover:bg-destructive/10 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="glass-blur border border-primary/20">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer définitivement cette facture ? Cette action ne peut pas être annulée.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteInvoice(invoice)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant={getCategoryBadgeVariant(invoice.categorie)} className="text-xs">
                              {invoice.categorie || 'Non catégorisé'}
                            </Badge>
                            <p className="text-xl font-bold text-primary">
                              €{invoice.montant_ttc?.toFixed(2) || '0.00'}
                            </p>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {invoice.vendeur && (
                              <p className="truncate">{invoice.vendeur}</p>
                            )}
                            <p>{formatDate(invoice.created_at)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  {selectedInvoice && (
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-blur border border-primary/20">
                      <DialogHeader className="pb-6">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <FileText className="h-6 w-6 text-primary" />
                          Facture - {selectedInvoice.vendeur || 'Fournisseur inconnu'}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                          Détails complets de la facture analysée par IA • {formatDate(selectedInvoice.created_at)}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Image Preview */}
                        <div className="space-y-4">
                          <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden border border-primary/20">
                            {selectedInvoice.image_url ? (
                              <img 
                                src={selectedInvoice.image_url} 
                                alt="Facture"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center">
                                <Receipt className="h-16 w-16 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="space-y-6">
                          {/* General Information */}
                          <Card className="stats-card-ultra primary">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                Informations Générales
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Vendeur:</span>
                                  <span className="font-medium">{selectedInvoice.vendeur || 'Non spécifié'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Catégorie:</span>
                                  <Badge variant={getCategoryBadgeVariant(selectedInvoice.categorie)}>
                                    {selectedInvoice.categorie || 'Non catégorisé'}
                                  </Badge>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Mode de paiement:</span>
                                  <span className="font-medium">{selectedInvoice.mode_paiement || 'Non spécifié'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Date facture:</span>
                                  <span className="font-medium">{selectedInvoice.date || 'Non spécifiée'}</span>
                                </div>
                                {selectedInvoice.numero_facture && (
                                  <>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">N° Facture:</span>
                                      <span className="font-medium font-mono">{selectedInvoice.numero_facture}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Totals */}
                          <Card className="stats-card-ultra success">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-lg flex items-center gap-2 text-success">
                                💰 Totaux Financiers
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">TVA:</span>
                                  <span className="font-medium">€{selectedInvoice.tva_total?.toFixed(2) || '0.00'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-lg">
                                  <span className="font-semibold">Total TTC:</span>
                                  <span className="font-bold text-success text-xl">€{selectedInvoice.montant_ttc?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Articles Table */}
                          {selectedInvoice.articles && selectedInvoice.articles.length > 0 && (
                            <Card className="chart-container-premium">
                              <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  📋 Articles ({selectedInvoice.articles.length})
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="rounded-lg border border-primary/20 overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-primary/5">
                                        <TableHead className="font-semibold">Description</TableHead>
                                        <TableHead className="text-center font-semibold">Qté</TableHead>
                                        <TableHead className="text-right font-semibold">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedInvoice.articles.map((article: any, index: number) => (
                                        <TableRow key={index} className="hover:bg-primary/5">
                                          <TableCell className="font-medium">
                                            {article.description}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {article.quantite}
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">
                                            €{article.total?.toFixed(2) || '0.00'}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && processingInvoices.size === 0 && (
        <Card className="chart-container-premium">
          <CardContent className="pt-12">
            <div className="text-center py-12">
              <div className="mb-6">
                <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-success mx-auto rounded-full" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Aucune facture trouvée</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Uploadez vos premières factures pour commencer l'analyse IA.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>✨ Traitement automatique</span>
                <span>•</span>
                <span>🤖 Intelligence artificielle</span>
                <span>•</span>
                <span>⚡ Temps réel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Invoice Dialog */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="max-w-2xl glass-blur border border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Modifier la facture
              </DialogTitle>
              <DialogDescription>
                Modifiez les informations de la facture de {editingInvoice.vendeur || 'Fournisseur inconnu'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendeur">Vendeur</Label>
                  <Input
                    id="vendeur"
                    value={editingInvoice.vendeur || ''}
                    onChange={(e) => setEditingInvoice({
                      ...editingInvoice,
                      vendeur: e.target.value
                    })}
                    className="border-primary/20 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Input
                    id="categorie"
                    value={editingInvoice.categorie || ''}
                    onChange={(e) => setEditingInvoice({
                      ...editingInvoice,
                      categorie: e.target.value
                    })}
                    className="border-primary/20 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode_paiement">Mode de paiement</Label>
                <Input
                  id="mode_paiement"
                  value={editingInvoice.mode_paiement || ''}
                  onChange={(e) => setEditingInvoice({
                    ...editingInvoice,
                    mode_paiement: e.target.value
                  })}
                  className="border-primary/20 focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_ttc">Montant TTC (€)</Label>
                  <Input
                    id="montant_ttc"
                    type="number"
                    step="0.01"
                    value={editingInvoice.montant_ttc || 0}
                    onChange={(e) => setEditingInvoice({
                      ...editingInvoice,
                      montant_ttc: parseFloat(e.target.value) || 0
                    })}
                    className="border-primary/20 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tva_total">TVA (€)</Label>
                  <Input
                    id="tva_total"
                    type="number"
                    step="0.01"
                    value={editingInvoice.tva_total || 0}
                    onChange={(e) => setEditingInvoice({
                      ...editingInvoice,
                      tva_total: parseFloat(e.target.value) || 0
                    })}
                    className="border-primary/20 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingInvoice(null)}
                  className="border-primary/20"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={() => handleUpdateInvoice(editingInvoice)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};