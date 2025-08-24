import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    if (!user) return;

    try {
      setLoading(true);
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
    if (user) {
      loadTvaRecords();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

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