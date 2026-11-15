-- Contact email from the source (OSM `email` / `contact:email`).
ALTER TABLE providers ADD COLUMN email TEXT;

-- Cached rows have no email yet. Mark every area as due for a refresh so emails are picked up on the
-- next search instead of up to 7 days later. The providers themselves are kept and still served
-- meanwhile (and if the upstream is down), so this only triggers a re-fetch.
DELETE FROM area_fetches;
