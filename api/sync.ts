// Vercel Serverless Function for AeroBlood Real-time database sync
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// In-memory cache for fast response on warm containers
let inMemoryStateCache: any = null;

async function getSharedState() {
  if (!supabase) {
    return null;
  }
  try {
    const { data } = await supabase
      .from("aeroblood_state")
      .select("payload")
      .eq("id", "global")
      .maybeSingle();

    if (data && data.payload) {
      return data.payload;
    }
  } catch (err) {
    console.warn("Error fetching global state from Supabase, trying fallback individual tables:", err);
  }

  try {
    const [
      hospitals,
      bloodBanks,
      donors,
      bloodUnits,
      sosAlerts,
      donationCamps,
      syncMessages
    ] = await Promise.all([
      supabase.from("hospitals").select("*"),
      supabase.from("blood_banks").select("*"),
      supabase.from("donors").select("*"),
      supabase.from("blood_units").select("*"),
      supabase.from("sos_alerts").select("*"),
      supabase.from("donation_camps").select("*"),
      supabase.from("sync_messages").select("*")
    ]);

    if (!hospitals.error && !bloodBanks.error) {
      return {
        hospitals: hospitals.data || [],
        bloodBanks: bloodBanks.data || [],
        donors: donors.data || [],
        bloodUnits: bloodUnits.data || [],
        sosAlerts: sosAlerts.data || [],
        donationCamps: donationCamps.data || [],
        syncMessages: syncMessages.data || []
      };
    }
  } catch (err) {
    console.warn("Failed to query individual tables:", err);
  }

  return null;
}

async function saveSharedState(payload: any) {
  if (!supabase) return;

  try {
    await supabase.from("aeroblood_state").upsert(
      { id: "global", payload },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("Failed to write to aeroblood_state table:", err);
  }

  try {
    if (payload.hospitals && payload.hospitals.length > 0) {
      await supabase.from("hospitals").upsert(payload.hospitals, { onConflict: "id" });
    }
    if (payload.bloodBanks && payload.bloodBanks.length > 0) {
      await supabase.from("blood_banks").upsert(payload.bloodBanks, { onConflict: "id" });
    }
    if (payload.donors && payload.donors.length > 0) {
      await supabase.from("donors").upsert(payload.donors, { onConflict: "id" });
    }
    if (payload.bloodUnits && payload.bloodUnits.length > 0) {
      await supabase.from("blood_units").upsert(payload.bloodUnits, { onConflict: "id" });
    }
    if (payload.sosAlerts && payload.sosAlerts.length > 0) {
      await supabase.from("sos_alerts").upsert(payload.sosAlerts, { onConflict: "id" });
    }
    if (payload.donationCamps && payload.donationCamps.length > 0) {
      await supabase.from("donation_camps").upsert(payload.donationCamps, { onConflict: "id" });
    }
    if (payload.syncMessages && payload.syncMessages.length > 0) {
      await supabase.from("sync_messages").upsert(payload.syncMessages.slice(0, 150), { onConflict: "id" });
    }
  } catch (err) {
    console.warn("Best-effort insert to individual tables failed. This is expected if they aren't initialized yet:", err);
  }
}

export default async function handler(req: any, res: any) {
  // Set basic CORS and content-type headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const state = await getSharedState();
    if (state) {
      inMemoryStateCache = state;
      return res.status(200).json(state);
    }
    return res.status(200).json(inMemoryStateCache || {});
  }

  if (req.method === 'POST') {
    const payload = req.body;
    inMemoryStateCache = payload;
    await saveSharedState(payload);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
