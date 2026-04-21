-- SCRIPT DE MIGRACAO / ATUALIZACAO (MIGRATION)
-- Use este script se você já possui as tabelas e deseja apenas adicionar as novas funções.

-- 1. Atualizando a tabela de MOTORISTAS (Drivers) para incluir Personalização de Marca (Branding)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE drivers ADD COLUMN brand_name TEXT;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column brand_name already exists';
    END;
    
    BEGIN
        ALTER TABLE drivers ADD COLUMN primary_color TEXT DEFAULT '#f97316';
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column primary_color already exists';
    END;
    
    BEGIN
        ALTER TABLE drivers ADD COLUMN background_color TEXT DEFAULT '#111827';
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column background_color already exists';
    END;
    
    BEGIN
        ALTER TABLE drivers ADD COLUMN custom_logo_url TEXT;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column custom_logo_url already exists';
    END;
    
    BEGIN
        ALTER TABLE drivers ADD COLUMN slug TEXT UNIQUE;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column slug already exists';
    END;
END $$;

-- 2. Atualizando a tabela de CORRIDAS (Rides) para suporte a Histórico Detalhado e GPS
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE rides ADD COLUMN origin_address TEXT;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column origin_address already exists';
    END;
    
    BEGIN
        ALTER TABLE rides ADD COLUMN start_location_json JSONB;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column start_location_json already exists';
    END;
    
    -- Caso sua tabela antiga use colunas texto para passageiro/destino, 
    -- é recomendado garantir que elas suportem JSON.
    -- Se as colunas abaixo não existirem, elas serão criadas.
    BEGIN
        ALTER TABLE rides ADD COLUMN passenger_json JSONB;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column passenger_json already exists';
    END;
    
    BEGIN
        ALTER TABLE rides ADD COLUMN destination_json JSONB;
    EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'column destination_json already exists';
    END;
END $$;
