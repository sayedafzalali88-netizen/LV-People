-- One-off for the client "Laxmi Vastralaya" (lvsheor): the 37 designations named in their employee
-- list, each mapped to the divisions they appear under in that file. Director (DG001) already existed.
-- Already run once in Supabase > SQL Editor on 2026-11-13. Safe to run again (skips names that already exist).
insert into public.designations (client_id, code, name, division_ids, active)
select (select id from public.clients where code='lvsheor'), v.code, v.name, v.divs, true
from (values
  ('DG002', 'Purchase Manager', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'9208d84f-74e5-47c8-833f-605929b4a46f'::uuid,'df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid,'7705cd69-3178-4c6d-8176-e7038b84e158'::uuid,'14c1eb16-23a8-4936-951f-edab4891af18'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid,'0ffef77d-da59-4191-9074-d7f1bf568a5b'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid]),
  ('DG003', 'Sales Executive', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'9208d84f-74e5-47c8-833f-605929b4a46f'::uuid,'df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid,'7705cd69-3178-4c6d-8176-e7038b84e158'::uuid,'14c1eb16-23a8-4936-951f-edab4891af18'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid,'0ffef77d-da59-4191-9074-d7f1bf568a5b'::uuid,'0becf9c9-d336-486f-adee-dc4451c77428'::uuid]),
  ('DG004', 'Division Manager', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'9208d84f-74e5-47c8-833f-605929b4a46f'::uuid,'df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid,'7705cd69-3178-4c6d-8176-e7038b84e158'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid,'0ffef77d-da59-4191-9074-d7f1bf568a5b'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid]),
  ('DG005', 'Sales Associates', array['9208d84f-74e5-47c8-833f-605929b4a46f'::uuid,'7705cd69-3178-4c6d-8176-e7038b84e158'::uuid,'14c1eb16-23a8-4936-951f-edab4891af18'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid,'0ffef77d-da59-4191-9074-d7f1bf568a5b'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid,'0becf9c9-d336-486f-adee-dc4451c77428'::uuid]),
  ('DG006', 'Support Staff', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'9208d84f-74e5-47c8-833f-605929b4a46f'::uuid,'df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid,'7705cd69-3178-4c6d-8176-e7038b84e158'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid,'0ffef77d-da59-4191-9074-d7f1bf568a5b'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid]),
  ('DG007', 'Jr. Sales Executive', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid,'14c1eb16-23a8-4936-951f-edab4891af18'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid,'0becf9c9-d336-486f-adee-dc4451c77428'::uuid]),
  ('DG008', 'Sr. Sales Executive', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid,'0becf9c9-d336-486f-adee-dc4451c77428'::uuid]),
  ('DG009', 'Customer Relation Executive', array['7705cd69-3178-4c6d-8176-e7038b84e158'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid]),
  ('DG010', 'Fashion Consultant', array['df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'0becf9c9-d336-486f-adee-dc4451c77428'::uuid]),
  ('DG011', 'Fashion Advisor', array['378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid,'566a1ad3-9f3a-473d-9549-079a75c3bdb0'::uuid]),
  ('DG012', 'Sales Supervisor', array['7e352e23-b5a0-4302-b320-84d9bf27c82b'::uuid,'378d967d-3aaf-4c2a-9437-d895d9ca2d28'::uuid]),
  ('DG013', 'Computer Operator', array['12bd4985-03e6-45f4-9d5a-5b73bbd22a32'::uuid,'df9c15a5-03da-4ab8-9030-d2aaee6e34ae'::uuid]),
  ('DG014', 'Back Office Executive', array['de692b14-63ab-4f8f-816e-5d8bd6d83710'::uuid,'4d025098-10ca-46ef-bb9d-5c2679513936'::uuid]),
  ('DG015', 'Admin Head', array['de692b14-63ab-4f8f-816e-5d8bd6d83710'::uuid]),
  ('DG016', 'Sr. Housekeeping', array['a47a1679-c3ab-4933-89cd-82cf19dfe874'::uuid]),
  ('DG017', 'Sales Cordinator', array['df5d10c0-a32d-4c73-8793-fa46fa6e3f2f'::uuid]),
  ('DG018', 'Store Manager', array['4d025098-10ca-46ef-bb9d-5c2679513936'::uuid]),
  ('DG019', 'Floor Manager', array['4d025098-10ca-46ef-bb9d-5c2679513936'::uuid]),
  ('DG020', 'Housekeeping', array['a47a1679-c3ab-4933-89cd-82cf19dfe874'::uuid]),
  ('DG021', 'Team Leader', array['ab7a6c4a-7e11-44ed-b7e9-c483da44b221'::uuid]),
  ('DG022', 'Electrician', array['d554bb50-a4f9-48f5-9961-d6225a74a992'::uuid]),
  ('DG023', 'Jr. Dispatcher', array['4bf0c1a4-0e9e-48d6-9550-27edd1bdfd8f'::uuid]),
  ('DG024', 'Supervisor – Logistic & Transport', array['977df166-5bd3-48bf-b903-28eed34d0daf'::uuid]),
  ('DG025', 'Jr. Housekeeping', array['a47a1679-c3ab-4933-89cd-82cf19dfe874'::uuid]),
  ('DG026', 'Tailor', array['4d025098-10ca-46ef-bb9d-5c2679513936'::uuid]),
  ('DG027', 'Billing Associate', array['4bf0c1a4-0e9e-48d6-9550-27edd1bdfd8f'::uuid]),
  ('DG028', 'Loader / Unloader', array['d97a2041-ac56-476e-816e-d5e19a36f427'::uuid]),
  ('DG029', 'Sr. Admin Executive', array['de692b14-63ab-4f8f-816e-5d8bd6d83710'::uuid]),
  ('DG030', 'Dispatcher', array['4bf0c1a4-0e9e-48d6-9550-27edd1bdfd8f'::uuid]),
  ('DG031', 'Driver', array['de692b14-63ab-4f8f-816e-5d8bd6d83710'::uuid]),
  ('DG032', 'Content Creator', array['7434d90c-6e81-4727-a2e6-2b1ca56bfbfa'::uuid]),
  ('DG033', 'Sweeper', array['a47a1679-c3ab-4933-89cd-82cf19dfe874'::uuid]),
  ('DG034', 'Trainer', array['4a6e91cf-d39b-4d7a-89f4-693ad5971b59'::uuid]),
  ('DG035', 'Security Guard', array['2f074457-c32d-49ed-9ae2-153a76d4778e'::uuid]),
  ('DG036', 'Tailor Trainee', array['4d025098-10ca-46ef-bb9d-5c2679513936'::uuid]),
  ('DG037', 'PRO', array['4d025098-10ca-46ef-bb9d-5c2679513936'::uuid]),
  ('DG038', 'Warehouse Associate', array['d97a2041-ac56-476e-816e-d5e19a36f427'::uuid])
) as v(code, name, divs)
where not exists (
  select 1 from public.designations d where d.client_id=(select id from public.clients where code='lvsheor') and d.name = v.name
);
