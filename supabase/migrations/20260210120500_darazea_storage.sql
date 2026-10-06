-- Storage buckets and their policies.
--
-- `product-photos` holds the pictures management uploads for a product and is publicly readable,
-- exactly as the storefront shows them. `payment-proof` holds a shopper's bank transfer slip and
-- is private: only management may read or write it.

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proof', 'payment-proof', false)
on conflict (id) do nothing;

drop policy if exists product_photos_read on storage.objects;
create policy product_photos_read on storage.objects
  for select using (bucket_id = 'product-photos');

drop policy if exists product_photos_manage on storage.objects;
create policy product_photos_manage on storage.objects
  for all using (bucket_id = 'product-photos' and public.is_management())
  with check (bucket_id = 'product-photos' and public.is_management());

drop policy if exists payment_proof_read on storage.objects;
create policy payment_proof_read on storage.objects
  for select using (bucket_id = 'payment-proof' and public.is_management());

drop policy if exists payment_proof_write on storage.objects;
create policy payment_proof_write on storage.objects
  for insert with check (bucket_id = 'payment-proof');
