import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface Invoice {
  id: number
  created_at: string
  user_id: string
  image_url: string
  date: string
  vendeur: string
  tva_total: number
  montant_ttc: number
  mode_paiement: string
  categorie: string
  numero_facture: string
  articles_description: string
  articles_quantite: number
  articles_totale: number
}

interface GroupedInvoice {
  id: string
  image_url: string
  vendeur: string
  categorie: string
  montant_ttc: number
  date: string
  created_at: string
  mode_paiement: string
  numero_facture: string
  articles: Array<{
    description: string
    quantite: number
    total: number
  }>
  tva_total: number
}

export const useRealTimeInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [groupedInvoices, setGroupedInvoices] = useState<GroupedInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingInvoices, setProcessingInvoices] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { toast } = useToast()

  const groupInvoicesByImage = (invoiceData: Invoice[]): GroupedInvoice[] => {
    const groupedMap = new Map<string, GroupedInvoice>()

    invoiceData.forEach((invoice) => {
      const key = invoice.image_url || `no-image-${invoice.id}`
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: key,
          image_url: invoice.image_url,
          vendeur: invoice.vendeur || '',
          categorie: invoice.categorie || '',
          montant_ttc: invoice.montant_ttc || 0,
          tva_total: invoice.tva_total || 0,
          date: invoice.date,
          created_at: invoice.created_at,
          mode_paiement: invoice.mode_paiement || '',
          numero_facture: invoice.numero_facture || '',
          articles: []
        })
      }

      if (invoice.articles_description) {
        const groupedInvoice = groupedMap.get(key)!
        groupedInvoice.articles.push({
          description: invoice.articles_description,
          quantite: invoice.articles_quantite || 0,
          total: invoice.articles_totale || 0
        })
      }
    })

    return Array.from(groupedMap.values())
  }

  const loadInvoices = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvoices(data || [])
      const grouped = groupInvoicesByImage(data || [])
      setGroupedInvoices(grouped)
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteInvoice = async (imageUrl: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', user.id)
        .eq('image_url', imageUrl)

      if (error) throw error

      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès."
      })

      // Remove from processing if it was being processed
      setProcessingInvoices(prev => {
        const newSet = new Set(prev)
        newSet.delete(imageUrl)
        return newSet
      })

      await loadInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture.",
        variant: "destructive"
      })
    }
  }

  const updateInvoice = async (imageUrl: string, updates: Partial<GroupedInvoice>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          vendeur: updates.vendeur,
          categorie: updates.categorie,
          mode_paiement: updates.mode_paiement,
          montant_ttc: updates.montant_ttc,
          tva_total: updates.tva_total,
        })
        .eq('user_id', user.id)
        .eq('image_url', imageUrl)

      if (error) throw error

      toast({
        title: "Facture modifiée",
        description: "Les informations ont été mises à jour avec succès."
      })

      await loadInvoices()
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier la facture.",
        variant: "destructive"
      })
    }
  }

  // Start processing animation when upload begins
  const startProcessing = (imageUrl: string) => {
    setProcessingInvoices(prev => new Set(prev).add(imageUrl))
  }

  // Stop processing animation when data arrives
  const stopProcessing = (imageUrl: string) => {
    setProcessingInvoices(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageUrl)
      return newSet
    })
  }

  useEffect(() => {
    if (!user) return

    loadInvoices()

    // Set up real-time subscription
    const channel = supabase
      .channel('invoices-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time invoice update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newInvoice = payload.new as Invoice
            // Stop processing animation for this image
            if (newInvoice.image_url) {
              stopProcessing(newInvoice.image_url)
            }
            toast({
              title: "Nouvelle facture traitée",
              description: "Votre facture a été analysée avec succès.",
            })
          }
          
          loadInvoices()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    invoices,
    groupedInvoices,
    isLoading,
    processingInvoices,
    loadInvoices,
    deleteInvoice,
    updateInvoice,
    startProcessing,
    stopProcessing
  }
}