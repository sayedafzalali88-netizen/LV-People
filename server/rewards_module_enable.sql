-- Enable the new "Rewards & Recognition" module for every existing client (the module itself is a built-in
-- feature of the app; this only adds it to each client's modules list, exactly like any other module they
-- can already switch on/off from Clients (live) > Modules).
-- Already run once in Supabase on 2026-11-15. Safe to run again.
update public.clients set modules = array_append(modules, 'rewards')
where not ('rewards' = any(modules));
