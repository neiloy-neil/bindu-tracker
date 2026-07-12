-- Backfill qc.status for existing rows that predate the trigger update
UPDATE qc
SET status = CASE
  WHEN out_qty > 0 THEN 'Completed'
  WHEN in_qty  > 0 THEN 'Ongoing'
  ELSE NULL
END
WHERE status IS NULL AND (in_qty > 0 OR out_qty > 0);
