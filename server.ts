import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Initialize Google GenAI client securely on the server-side
const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

if (aiClient) {
  console.log("Gemini API Client initialized successfully from environment secrets.");
} else {
  console.log("Gemini API Client bypassed: GEMINI_API_KEY is not configured yet.");
}

let supabase: any = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  console.log("Supabase Client initialized in development server");
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.log("Supabase Client bypassed: Credentials not configured yet. Falling back to local in-memory DB.");
}

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with high body limit to accommodate full-state sync
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Global server-side in-memory shared database state (used as memory-cache/fallback if no Supabase)
  let localSharedState: any = null;

  // Sync API endpoints
  app.get("/api/sync", async (req, res) => {
    const state = await getSharedState();
    if (state) {
      res.json(state);
    } else {
      res.json(localSharedState);
    }
  });

  app.post("/api/sync", async (req, res) => {
    const payload = req.body;
    localSharedState = payload;
    await saveSharedState(payload);
    res.json({ success: true });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", synced: !!localSharedState, usingSupabase: !!supabase });
  });

  // Secure server-side endpoint for Gemini AI Companion
  app.post("/api/gemini/chat", async (req, res) => {
    const { message, history } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }
    if (!aiClient) {
      return res.status(500).json({ error: "AI Client failed to initialize." });
    }

    try {
      const systemInstruction = `
You are AeroBlood AI, an intelligent co-pilot for the AeroBlood National Blood Grid Network.
AeroBlood is a real-time blood intelligence platform that connects hospitals, blood banks, and donors in a seamless grid.

Your role:
- Answer medical, logistical, or blood-matching questions for clinicians, administrators, or prospective donors.
- Advise on blood group compatibility (e.g., O- is universal donor of red cells, AB+ is universal recipient; opposite holds for plasma).
- Educate on blood components shelf life (e.g., Platelets last 5 days; Packed Red Cells last 42 days; Fresh Frozen Plasma lasts 1 year).
- Formulate hypothetical grid optimization plans and guide on donation safety guidelines (e.g., recovery intervals, travel restrictions).
- Maintain a warm, extremely clear, clinical-grade, yet encouraging tone.
- Keep answers brief, under 150 words, structured, and easy to read on small widget screens.
`;

      const chat = aiClient.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      let responseText = "";
      if (history && Array.isArray(history) && history.length > 0) {
        const contents = history.map((turn: any) => ({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        }));
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });

        const result = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            systemInstruction,
          }
        });
        responseText = result.text || "No response text was generated.";
      } else {
        const response = await chat.sendMessage({ message });
        responseText = response.text || "No response text was generated.";
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini API server-side execution error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Gemini." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
