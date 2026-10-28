import { supabase } from "@/lib/supabase";

export interface ContactLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  created_at: string;
}

export type ContactLeadPayload = Omit<ContactLead, "id" | "created_at">;

export async function saveContactLead(payload: ContactLeadPayload) {
  const { error } = await supabase.from("contact_leads").insert(payload);
  if (error) throw error;
}

export async function fetchContactLeads(): Promise<ContactLead[]> {
  const { data, error } = await supabase
    .from("contact_leads")
    .select("id, name, email, phone, service, message, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContactLead[];
}
