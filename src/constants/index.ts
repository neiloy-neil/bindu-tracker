export const COLOR_OPTIONS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White',
  'Orange', 'Pink', 'Purple', 'Brown',
  'White Melange', 'Grey Melange', 'Navy',
  'Deep Biskut', 'Misti', 'Light Biskut', 'Kolija', 'Sky', 'Contrast',
] as const;

export const BRANCHES = [
  'Aziz-1', 'Aziz-2', 'Aziz-3',
  'Cox-1', 'Cox-2', 'Cox-3',
  'Teknaf', 'Basurhat', 'Jessore',
  'Barisal', 'Lamabazar', 'Dorgagate', 'Online',
] as const;

export const PRINT_STATUS  = ['Out for Print', 'Received from Print'] as const;
export const SEW_STATUS    = ['Ongoing', 'Completed', 'HOLD'] as const;
export const QC_STATUS     = ['Ongoing', 'Completed'] as const;
export const PRODUCT_STAGES = [
  'Cutting', 'Printing', 'Sewing', 'QC', 'Finishing', 'Dispatched', 'Completed',
] as const;

export const MAX_DAILY_ENTRIES = 6;
export const MAX_DISPATCH_SLOTS = 3;
