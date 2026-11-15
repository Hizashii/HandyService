-- Contact details read from a provider's own website. Kept apart from phone/email (which come from
-- OpenStreetMap and are rewritten on every refresh) so a refresh never wipes what we found on the site.
ALTER TABLE providers ADD COLUMN site_phone TEXT;
ALTER TABLE providers ADD COLUMN site_email TEXT;
-- When the website was last checked (unix ms), so each site is looked at once per month at most,
-- whether or not anything was found.
ALTER TABLE providers ADD COLUMN contact_checked_at INTEGER;
