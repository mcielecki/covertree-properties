-- Runs once, on first start of an empty data volume.
-- POSTGRES_DB (dev database) is created by the image itself.
CREATE DATABASE covertree_test; -- API integration tests (Vitest)
CREATE DATABASE covertree_e2e;  -- Playwright E2E
