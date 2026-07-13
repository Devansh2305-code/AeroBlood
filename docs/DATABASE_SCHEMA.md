# AeroBlood PostgreSQL Database Schema & Security Architecture

This document outlines the complete production-grade PostgreSQL schema designed for **AeroBlood**. This schema is fully compliant with Supabase and standard PostgreSQL 15+, detailing all table relationships, foreign key constraints, compound indexes for localized searches, and strict Role-Based Access Control (RBAC) Row-Level Security (RLS) policies.

---

## 1. Database Entity-Relationship Diagram (Conceptual)

```
 [Users/Auth]
      │ (1:1)
      ├────────────────────────┬────────────────────────┐
      ▼ (id)                   ▼ (id)                   ▼ (id)
[Hospitals]              [BloodBanks]             [Donors]
      │ (1:N)                  │ (1:N)                  │
      ▼                        ▼                        │
 [SOSAlerts] <─────────── [BloodUnits] <────────────────┘ (Donated blood logs)
   (Active requests)        (Refrigerated reserves)
```

---

## 2. SQL DDL Declarations (Supabase Compliant)

### Enums & Extensions
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For coordinates spatial indexes

-- Global Roles and Component Types
CREATE TYPE user_role AS ENUM ('super_admin', 'hospital', 'blood_bank', 'donor');
CREATE TYPE component_type AS ENUM ('Whole Blood', 'Packed Red Cells', 'Platelets', 'Fresh Frozen Plasma');
CREATE TYPE unit_status AS ENUM ('Available', 'Reserved', 'Used', 'Expired');
CREATE TYPE sos_priority AS ENUM ('Critical', 'High', 'Medium');
CREATE TYPE sos_status AS ENUM ('Active', 'Fulfilled', 'Cancelled');
CREATE TYPE camp_status AS ENUM ('Upcoming', 'Active', 'Completed');
```

### Table: Profiles / Users (Unified RBAC)
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table: Hospitals
```sql
CREATE TABLE public.hospitals (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    hospital_type VARCHAR(50) CHECK (hospital_type IN ('Government', 'Private', 'Trust', 'Military')) NOT NULL,
    emergency_contact VARCHAR(30) NOT NULL,
    hospital_id_type VARCHAR(100) NOT NULL,
    hospital_id_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Capacity Resources
    bed_count INT DEFAULT 0 CHECK (bed_count >= 0),
    total_doctors INT DEFAULT 0 CHECK (total_doctors >= 0),
    icu_count INT DEFAULT 0 CHECK (icu_count >= 0),
    room_count INT DEFAULT 0 CHECK (room_count >= 0),
    opd_available BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table: Blood Banks
```sql
CREATE TABLE public.blood_banks (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    bank_type VARCHAR(50) CHECK (bank_type IN ('Red Cross', 'Government', 'Private', 'Charity')) NOT NULL,
    emergency_contact VARCHAR(30) NOT NULL,
    e_raktkosh_id VARCHAR(100) UNIQUE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table: Donors
```sql
CREATE TABLE public.donors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    age INT CHECK (age >= 18 AND age <= 100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    last_donation_date DATE,
    points INT DEFAULT 100 CHECK (points >= 0) NOT NULL,
    donor_passport_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Medical Deferrals checklists
    has_cancer BOOLEAN DEFAULT FALSE NOT NULL,
    has_viral_disease BOOLEAN DEFAULT FALSE NOT NULL,
    has_asthma BOOLEAN DEFAULT FALSE NOT NULL,
    has_active_infection BOOLEAN DEFAULT FALSE NOT NULL,
    has_hiv BOOLEAN DEFAULT FALSE NOT NULL,
    has_hepatitis_b BOOLEAN DEFAULT FALSE NOT NULL,
    has_hepatitis_c BOOLEAN DEFAULT FALSE NOT NULL,
    has_tuberculosis BOOLEAN DEFAULT FALSE NOT NULL,
    has_leprosy BOOLEAN DEFAULT FALSE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table: Blood Units (Inventory)
```sql
CREATE TABLE public.blood_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blood_bank_id UUID REFERENCES public.blood_banks(id) ON DELETE CASCADE NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    component_type component_type NOT NULL,
    units INT DEFAULT 1 CHECK (units >= 1) NOT NULL,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status unit_status DEFAULT 'Available' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_expiry_after_collection CHECK (expiry_date >= collection_date)
);
```

### Table: SOS Alerts
```sql
CREATE TABLE public.sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    component_type component_type NOT NULL,
    units_required INT NOT NULL CHECK (units_required >= 1),
    priority sos_priority NOT NULL DEFAULT 'Critical',
    remarks TEXT,
    status sos_status DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table: Donation Campaigns / Camps
```sql
CREATE TABLE public.donation_camps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    camp_date DATE NOT NULL,
    camp_time VARCHAR(100) NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    status camp_status DEFAULT 'Upcoming' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 3. Database Indexing & Optimizations

```sql
-- B-Tree Indexes for fast primary foreign lookup & filtering
CREATE INDEX idx_blood_units_bank ON public.blood_units(blood_bank_id);
CREATE INDEX idx_blood_units_search ON public.blood_units(blood_group, status);
CREATE INDEX idx_sos_alerts_active ON public.sos_alerts(status) WHERE status = 'Active';
CREATE INDEX idx_donors_search_group ON public.donors(blood_group);

-- Spatial Indexes for Google Maps / Geolocation Radial searches (using PostGIS points)
ALTER TABLE public.hospitals ADD COLUMN geog GEOGRAPHY(Point, 4326);
CREATE INDEX idx_hospitals_geo ON public.hospitals USING GIST(geog);

ALTER TABLE public.blood_banks ADD COLUMN geog GEOGRAPHY(Point, 4326);
CREATE INDEX idx_blood_banks_geo ON public.blood_banks USING GIST(geog);
```

---

## 4. Row-Level Security (RLS) Policies

```sql
-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can edit their own profiles"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Hospitals Policies
CREATE POLICY "Hospitals are viewable by all authenticated users"
ON public.hospitals FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Hospital profile can be updated by itself"
ON public.hospitals FOR UPDATE USING (auth.uid() = id);

-- 3. SOS Alerts Policies
CREATE POLICY "SOS alerts are visible to all users"
ON public.sos_alerts FOR SELECT USING (TRUE);

CREATE POLICY "Hospitals can insert their own SOS alerts"
ON public.sos_alerts FOR INSERT WITH CHECK (
    auth.uid() = hospital_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hospital')
);

CREATE POLICY "Hospitals can update their own SOS alerts"
ON public.sos_alerts FOR UPDATE USING (auth.uid() = hospital_id);
```

---

## 5. Audit Logging Architecture

```sql
-- Create audit table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    executed_by UUID REFERENCES public.profiles(id),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Trigger Function for Auditing
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (table_name, action_type, record_id, old_data, new_data, executed_by)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit trigger to Blood Units Inventory
CREATE TRIGGER audit_blood_units_changes
AFTER INSERT OR UPDATE OR DELETE ON public.blood_units
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```
