-- AeroRUL RUL model metadata: REVIEW FIRST, RUN MANUALLY IN pgAdmin ONLY WHEN YOU APPROVE.
-- PostgreSQL login: the database owner/authorized application DBA (e.g. postgres).
-- This is metadata registration, NOT model training or database schema migration.
-- Requires existing public.ml_model_versions schema.
-- Version is the application release ID for the transferred FD002 seed-42 checkpoint.
INSERT INTO public.ml_model_versions (
  model_name, version, dataset_subset, model_object_key, scaler_object_key,
  preprocessing_version, window_size, sensor_schema, is_active
)
VALUES (
  'condition_aware_itransformer_v3',
  'fd002-seed42-v3',
  'FD002',
  'rul-service/checkpoints/best_model.weights.h5',
  'rul-service/preprocessing/scaler_artifacts.json',
  'condition_kmeans_pc_v2',
  30,
  '{"input_format":"csv","unit_column":"unit","cycle_column":"cycle","operating_settings":["setting_1","setting_2","setting_3"],"selected_sensors":["sensor_2","sensor_3","sensor_4","sensor_7","sensor_8","sensor_9","sensor_11","sensor_12","sensor_13","sensor_14","sensor_15","sensor_17","sensor_20","sensor_21"],"regimes":6,"dataset":"NASA_CMAPSS_FD002","is_demo":true}'::json,
  TRUE
)
ON CONFLICT (model_name, version) DO NOTHING;

-- Read-only confirmation, same DBA login:
SELECT model_version_id, model_name, version, dataset_subset, window_size, is_active
FROM public.ml_model_versions
WHERE model_name = 'condition_aware_itransformer_v3' AND version = 'fd002-seed42-v3';
