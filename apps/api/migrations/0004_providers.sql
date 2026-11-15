-- Idempotent (IF NOT EXISTS): local dev databases created while this file was still named 0001_init
-- already have these tables, and re-running it must not fail.
-- Providers collected from external sources (currently OpenStreetMap).
CREATE TABLE IF NOT EXISTS providers (
  id          TEXT PRIMARY KEY,          -- e.g. "osm_n123456"
  source      TEXT NOT NULL,             -- "osm"
  name        TEXT NOT NULL,
  categories  TEXT NOT NULL,             -- JSON array of category ids
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  city        TEXT,
  address     TEXT,
  phone       TEXT,
  website     TEXT,
  fetched_at  INTEGER NOT NULL           -- unix ms
);

-- Bounding-box prefilter for geo queries.
CREATE INDEX IF NOT EXISTS idx_providers_lat_lng ON providers (lat, lng);

-- Ratings per provider per source. Empty for OSM; filled by future sources
-- (e.g. Google Places, Trustpilot) without changing the API shape.
CREATE TABLE IF NOT EXISTS provider_ratings (
  provider_id   TEXT NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
  source        TEXT NOT NULL,
  rating        REAL NOT NULL,
  review_count  INTEGER NOT NULL,
  url           TEXT,
  PRIMARY KEY (provider_id, source)
);

-- Which (grid cell, category) areas were fetched and when, so a search only
-- hits the upstream source when the area is missing or stale.
CREATE TABLE IF NOT EXISTS area_fetches (
  cell        TEXT NOT NULL,             -- snapped "lat,lng" grid cell
  category    TEXT NOT NULL,             -- category id or "all"
  fetched_at  INTEGER NOT NULL,          -- unix ms
  PRIMARY KEY (cell, category)
);
