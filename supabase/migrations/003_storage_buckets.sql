-- Create a new storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'product-images' );

create policy "Authenticated users can upload images"
on storage.objects for insert
with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
);

create policy "Authenticated users can delete images"
on storage.objects for delete
using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
);
