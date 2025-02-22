
import { supabase } from "@/integrations/supabase/client";

export async function getContract(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
