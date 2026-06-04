-- Add clone tracking columns to the trips table.
-- is_cloned  : true when this trip was duplicated from another trip.
-- cloned_from: references the original trip; set to NULL if the source is deleted.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS is_cloned   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cloned_from uuid    REFERENCES trips(id) ON DELETE SET NULL;
