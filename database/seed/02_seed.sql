-- =========================================================
-- GOLD SEED DATA
-- Aircraft B2B Marketplace
-- =========================================================
--
-- Source: data/gold/*.csv
--
-- Load order follows foreign-key dependencies:
--
--  1. companies
--  2. addresses
--  3. categories
--  4. engine_models
--  5. suppliers
--  6. aircraft
--  7. engines
--  8. products
--  9. seller_listings
-- 10. product_engine_compatibility
--
-- Gold contains initial/reference seed data only.
-- Runtime tables such as users, carts, orders, payments,
-- RUL predictions, reviews, and notifications are populated
-- by application workflows.
-- =========================================================


-- ---------------------------------------------------------
-- 1. COMPANIES
-- Source: data/gold/companies.csv
-- Columns:
-- company_id, company_name, company_type,
-- tax_id, country_code, created_at
-- ---------------------------------------------------------


-- ---------------------------------------------------------
-- 2. ADDRESSES
-- Source: data/gold/addresses.csv
-- Columns:
-- address_id, company_id, recipient_name, phone,
-- address_line, city, region, postal_code, country_code
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 3. CATEGORIES
-- Source: data/gold/categories.csv
-- Columns:
-- category_id, category_name, slug, description
-- ---------------------------------------------------------


-- ---------------------------------------------------------
-- 4. ENGINE MODELS
-- Source: data/gold/engine_models.csv
-- Columns:
-- engine_model_id, manufacturer, model_name,
-- engine_family, engine_type
-- ---------------------------------------------------------


-- ---------------------------------------------------------
-- 5. SUPPLIERS
-- Source: data/gold/suppliers.csv
-- Columns:
-- supplier_id, company_id, store_name, slug,
-- description, logo_object_key, status, created_at
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 6. AIRCRAFT
-- Source: data/gold/aircraft.csv
-- Columns:
-- aircraft_id, company_id, registration_number,
-- manufacturer, model, aircraft_type,
-- year, status, created_at
-- ---------------------------------------------------------


-- ---------------------------------------------------------
-- 7. ENGINES
-- Source: data/gold/engines.csv
-- Columns:
-- engine_id, aircraft_id, engine_model_id,
-- engine_code, serial_number, current_cycle, created_at
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 8. PRODUCTS
-- Source: data/gold/products.csv
-- Columns:
-- product_id, category_id, product_name, manufacturer,
-- part_number, product_type, description,
-- technical_specs, is_active, created_at
-- ---------------------------------------------------------


-- ---------------------------------------------------------
-- 9. SELLER LISTINGS
-- Source: data/gold/seller_listings.csv
-- Columns:
-- listing_id, supplier_id, product_id, seller_sku,
-- condition, price, stock_quantity,
-- lead_time_days, status, updated_at
-- ---------------------------------------------------------


-- ---------------------------------------------------------
-- 10. PRODUCT ENGINE COMPATIBILITY
-- Source: data/gold/product_engine_compatibility.csv
-- Columns:
-- product_id, engine_model_id,
-- evidence_reference, is_demo
-- ---------------------------------------------------------