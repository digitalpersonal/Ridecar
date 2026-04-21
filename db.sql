-- SCRIPT SQL PARA RIDE CAR (SUPABASE / POSTGRESQL)
-- Versão: 1.0 (Com suporte a Histórico Detalhado, Voz e Branding)

-- 1. Tabela de Motoristas (Drivers)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    car_model TEXT,
    license_plate TEXT,
    city TEXT,
    role TEXT DEFAULT 'driver', -- 'driver' ou 'admin'
    pix_key TEXT,
    photo_url TEXT,
    brand_name TEXT,
    primary_color TEXT,
    background_color TEXT,
    custom_logo_url TEXT,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Regras de Tarifas (Fare Rules)
CREATE TABLE IF NOT EXISTS fare_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    fare FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Passageiros/Clientes (Passengers)
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    cpf TEXT,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Corridas (Rides) - O "Coração" do Histórico
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    passenger_json JSONB NOT NULL, -- Dados do passageiro no momento da corrida
    destination_json JSONB NOT NULL, -- Endereço e Cidade de destino
    start_location_json JSONB, -- Coordenadas GPS [lat, lng] do início
    origin_address TEXT, -- Endereço de texto capturado pelo GPS
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    distance FLOAT DEFAULT 0,
    fare FLOAT DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- POLÍTICAS DE SEGURANÇA (RLS) - Opcional, mas recomendado para Supabase
-- Habilitar RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- EXEMPO DE MOTORISTA ADMINISTRADOR (Troque pelo seu email após o primeiro acesso)
-- INSERT INTO drivers (name, email, password, role, city) 
-- VALUES ('Admin RideCar', 'seu-email@gmail.com', 'admin123', 'admin', 'Guaranésia');
