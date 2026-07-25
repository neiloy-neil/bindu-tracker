-- Remove the auto-aggregate trigger from production_entries.
-- The daily entry sheet and the product tracker (cutting/printing/sewing/qc/
-- finishing/dispatch tabs) are separate tools. The trigger was overwriting
-- manually-entered product stage data with aggregated daily totals, and also
-- contained a cast to a non-existent type (::product_stage) that caused
-- every linked-row save to fail with "type does not exist".
DROP TRIGGER IF EXISTS trg_aggregate_production ON production_entries;
DROP FUNCTION IF EXISTS aggregate_production_entries();
