# AeroBlood Production Deployment and Cloud Provisioning Guide

This guide details the step-by-step procedures for deploying **AeroBlood** onto production environments (Google Cloud Run containers, Supabase database, and Google Maps API).

---

## 1. Supabase Database Provisioning

1. Sign in to your [Supabase Console](https://supabase.com).
2. Create a new project called **AeroBlood**. Select your nearest geographic region.
3. Open the **SQL Editor** tab from the left sidebar.
4. Open `/docs/DATABASE_SCHEMA.md` from the AeroBlood source repository, copy the entire block of SQL commands, paste it into the Supabase SQL editor, and click **Run**.
5. This registers all:
   * Customs Enums and Extensions (UUID, PostGIS).
   * Tables (`profiles`, `hospitals`, `blood_banks`, `donors`, `blood_units`, `sos_alerts`, `donation_camps`).
   * B-Tree and Spatial Geography indexes.
   * Row-Level Security (RLS) RBAC policies.
   * Trigger Functions for audit trails.

---

## 2. Setting Up OAuth and Auth Redirects

In the Supabase Console, navigate to **Authentication** > **URL Configuration**:
1. Set the **Site URL** to your Google Cloud Run service URL, e.g., `https://aeroblood-app.aistudio.run`.
2. Register OAuth Providers (Google, etc.) if required by editing credentials under Providers.

---

## 3. Google Maps Platform Credentialing

AeroBlood leverages Google Maps API vectors for radial queries and geolocation.
1. Sign in to your [Google Cloud Console](https://console.cloud.google.com).
2. Enable the **Maps JavaScript API** and **Places API (New)** on your project.
3. Navigate to **APIs & Services** > **Credentials** and click **Create Credentials** > **API Key**.
4. Set restrictions on your API key to only allow requests from your production Cloud Run domain to prevent unauthorized quota theft.

---

## 4. Container Compilation & Cloud Run Deployment

Because AeroBlood is bundled as a clean React/Vite Single Page Application, its static assets are served efficiently. You can compile and deploy the application instantly with:

```bash
# Compile static output
npm run build

# Deploy onto Google Cloud Run (Using gcloud SDK)
gcloud run deploy aeroblood-production \
  --source . \
  --port 3000 \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars="SUPABASE_URL=your-supabase-url,SUPABASE_ANON_KEY=your-supabase-key,GOOGLE_MAPS_API_KEY=your-maps-key"
```

The Cloud Run routing plane will capture port `3000` ingress and route traffic cleanly to the client bundle.
