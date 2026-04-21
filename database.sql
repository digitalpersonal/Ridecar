-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO - RIDECAR APP V2
-- Copie e cole este script no SQL Editor do Supabase
-- ==========================================

-- 1. Habilita a extensão nativa para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CRIAÇÃO DAS TABELAS (SCHEMA)
-- ==========================================

-- Tabela de Motoristas (Drivers/Admins)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    car_model TEXT,
    license_plate TEXT,
    city TEXT,
    role TEXT DEFAULT 'driver',
    pix_key TEXT,
    photo_url TEXT,
    brand_name TEXT,
    primary_color TEXT DEFAULT '#f97316',
    background_color TEXT DEFAULT '#030712',
    custom_logo_url TEXT,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Passageiros (Clientes)
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    cpf TEXT,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Corridas (Rides)
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    passenger_json JSONB NOT NULL,
    destination_json JSONB NOT NULL,
    origin_address TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    distance FLOAT DEFAULT 0,
    fare FLOAT NOT NULL,
    start_location_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Regras de Preço (Fare Rules)
CREATE TABLE IF NOT EXISTS fare_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    fare FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 3. INSERÇÃO DO ADMIN INICIAL (SILVIO)
-- ==========================================
-- Nota: Defina o e-mail de acesso e a senha inicial abaixo.

INSERT INTO drivers (name, email, password, role, car_model, license_plate, city, pix_key, brand_name)
VALUES (
    'Silvio', 
    'silvio@ridecar.com.br', -- ALTERE EMAIL DE ACESSO AQUI
    'silvio123',             -- ALTERE SENHA DE ACESSO AQUI
    'admin', 
    'Carro Admin', 
    'ADM-0000', 
    'Guaranésia',
    'sua-chave-pix-aqui',
    'RideCar Oficial'
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', name = 'Silvio';


-- ==========================================
-- 4. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ==========================================

-- Ativando RLS nas tabelas
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_rules ENABLE ROW LEVEL SECURITY;

-- ATENÇÃO SOBRE AS POLÍTICAS ABAIXO:
-- O aplicativo gerencia a validação de login internamente no frontend (usando a 'anon_key').
-- Para que o app funcione sem o Supabase Auth (onde os usuários criam conta pelo e-mail com confirmação),
-- as políticas abaixo autorizam operações ao sistema autenticado pelo Front-End (App).
-- Se desejar bloquear acessos externos via API futuramente, recomendamos migrar para o Supabase Auth nativo.

-- Políticas (Policies) para a tabela de Drivers
DROP POLICY IF EXISTS "Permitir operações gerais em drivers" ON drivers;
CREATE POLICY "Permitir operações gerais em drivers" ON drivers FOR ALL USING (true);

-- Políticas (Policies) para a tabela de Passengers
DROP POLICY IF EXISTS "Permitir operações gerais em passengers" ON passengers;
CREATE POLICY "Permitir operações gerais em passengers" ON passengers FOR ALL USING (true);

-- Políticas (Policies) para a tabela de Rides
DROP POLICY IF EXISTS "Permitir operações gerais em rides" ON rides;
CREATE POLICY "Permitir operações gerais em rides" ON rides FOR ALL USING (true);

-- Políticas (Policies) para a tabela de Fare Rules
DROP POLICY IF EXISTS "Permitir operações gerais em fare_rules" ON fare_rules;
CREATE POLICY "Permitir operações gerais em fare_rules" ON fare_rules FOR ALL USING (true);
