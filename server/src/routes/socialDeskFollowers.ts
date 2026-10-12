import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const syncSchema = z.object({
  clientId: z.string().uuid(),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type SocialDeskClient = {
  id: string;
  instagram: string | null;
  facebook: string | null;
  instagram_business_account_id: string | null;
  facebook_page_id: string | null;
};

type FollowerSnapshot = {
  id: string;
  instagram_followers: number;
  instagram_start_followers: number;
  facebook_followers: number;
  facebook_start_followers: number;
};

async function requireSocialDeskStaff(authHeader: string | undefined) {
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Please sign in again before syncing followers.");

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session. Please sign in again.");

  const { data: role, error: roleError } = await supabase
    .from("social_desk_user_roles")
    .select("id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();
  if (roleError) throw roleError;
  if (!role) throw new Error("You do not have SocialDesk access.");
}

async function graphGet(path: string, fields: string): Promise<Record<string, any>> {
  const token = process.env.META_GRAPH_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Auto sync needs META_GRAPH_ACCESS_TOKEN in server/.env.");
  }

  const version = process.env.META_GRAPH_API_VERSION || "v21.0";
  const url = new URL(`https://graph.facebook.com/${version}/${path}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", token);

  const response = await fetch(url);
  const body = (await response.json()) as Record<string, any>;
  if (!response.ok) {
    throw new Error(body?.error?.message || "Meta Graph API request failed.");
  }
  return body;
}

export const socialDeskFollowersRouter = Router();

socialDeskFollowersRouter.post("/sync", async (req, res) => {
  await requireSocialDeskStaff(req.header("authorization"));

  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid sync request." });
    return;
  }

  const snapshotDate = parsed.data.snapshotDate || new Date().toISOString().slice(0, 10);
  const { data: client, error: clientError } = await supabase
    .from("social_desk_clients")
    .select("id, instagram, facebook, instagram_business_account_id, facebook_page_id")
    .eq("id", parsed.data.clientId)
    .single<SocialDeskClient>();
  if (clientError) throw clientError;

  if (!client.instagram_business_account_id) {
    res.status(400).json({ error: "Add Instagram Business Account ID for this client before auto sync." });
    return;
  }

  const instagram = await graphGet(client.instagram_business_account_id, "followers_count,username");
  let facebookFollowers = 0;
  if (client.facebook_page_id) {
    const facebook = await graphGet(client.facebook_page_id, "followers_count,fan_count,name");
    facebookFollowers = Number(facebook.followers_count ?? facebook.fan_count ?? 0);
  }
  const instagramFollowers = Number(instagram.followers_count ?? 0);

  const { data: existingSnapshot, error: existingError } = await supabase
    .from("social_desk_follower_snapshots")
    .select("id, instagram_followers, instagram_start_followers, facebook_followers, facebook_start_followers")
    .eq("client_id", client.id)
    .eq("snapshot_date", snapshotDate)
    .maybeSingle<FollowerSnapshot>();
  if (existingError) throw existingError;

  const { data: previousSnapshot, error: previousError } = await supabase
    .from("social_desk_follower_snapshots")
    .select("id, instagram_followers, instagram_start_followers, facebook_followers, facebook_start_followers")
    .eq("client_id", client.id)
    .lt("snapshot_date", snapshotDate)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle<FollowerSnapshot>();
  if (previousError) throw previousError;

  const payload = {
    client_id: client.id,
    snapshot_date: snapshotDate,
    instagram_start_followers:
      existingSnapshot?.instagram_start_followers ??
      previousSnapshot?.instagram_followers ??
      instagramFollowers,
    instagram_followers: instagramFollowers,
    facebook_start_followers:
      existingSnapshot?.facebook_start_followers ??
      previousSnapshot?.facebook_followers ??
      facebookFollowers,
    facebook_followers: facebookFollowers,
    instagram_url: client.instagram,
    facebook_url: client.facebook,
    notes: `Auto synced from Meta Graph API${instagram.username ? ` (@${instagram.username})` : ""}`,
  };

  const { data, error } = await supabase
    .from("social_desk_follower_snapshots")
    .upsert(payload, { onConflict: "client_id,snapshot_date" })
    .select("*")
    .single();
  if (error) throw error;

  res.json({ ok: true, snapshot: data });
});
