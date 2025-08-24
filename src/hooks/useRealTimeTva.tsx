import { useState, useEffect } from "react";
import { supabase, isDemoMode } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TvaRecord {
  id: number;
  user_id: string;
  date?: string;
  numero_facture?: string;
  vendeur?: string;
  montant_ttc?: number;
  tva_20?: number;
  tva_10?: number;
  tva_5_5?: number;
  created_at: string;
}

export const useRealTimeTva = () => {
  const [tvaRecords, setTvaRecords] = useState<TvaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTvaRecords = async () => {
    if (!user && !isDemoMode) return;

    try {
      setLoading(true);
      
      if (isDemoMode) {
        // Données factices TVA pour le mode démo
        const demoTvaData: TvaRecord[] = [
          {
            id: 1,
            user_id: 'demo-user',
            date: '2024-01-15',
            numero_facture: 'FAC001',
            vendeur: 'Carrefour',
            montant_ttc: 25.50,
            tva_20: 4.2,
            tva_10: 0,
            tva_5_5: 0,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            user_id: 'demo-user',
            date: '2024-01-10',
            numero_facture: 'AMZ002',
            vendeur: 'Amazon',
            montant_ttc: 48.00,
            tva_20: 8.0,
            tva_10: 0,
            tva_5_5: 0,
            created_at: new Date().toISOString()
          }
        ];
        
        setTvaRecords(demoTvaData);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('total_tva')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTvaRecords(data || []);
    } catch (error) {
      console.error('Error loading TVA records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user || isDemoMode) {
      loadTvaRecords();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || isDemoMode) return;

    const channel = supabase
      .channel('total_tva_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'total_tva',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadTvaRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    tvaRecords,
    loading,
    refetch: loadTvaRecords
  };
};