-- Designation is mapped under Divisions (all their sub-divisions). parent_ids (sub-divisions) now only narrows it, and is optional.
-- Applied on 2026-11-11. Every division also gets one "General" sub-division, so people and plan rows can use it.
alter table public.designations add column if not exists division_ids uuid[];

update public.designations d set division_ids = x.divs
from (
  select g.id, array_agg(distinct pd) as divs
  from public.designations g
  cross join lateral unnest(g.parent_ids) as sid
  join public.sub_divisions sd on sd.id = sid
  cross join lateral unnest(sd.parent_ids) as pd
  where g.parent_ids is not null and array_length(g.parent_ids,1) > 0
  group by g.id
) x
where d.id = x.id and d.division_ids is null;

insert into public.sub_divisions (client_id, name, parent_ids, active, num_id)
select v.client_id, 'General', array[v.id], true,
  coalesce((select max(s.num_id) from public.sub_divisions s where s.client_id = v.client_id),0)
  + row_number() over (partition by v.client_id order by v.num_id nulls last, v.id)
from public.divisions v
where not exists (select 1 from public.sub_divisions s where v.id = any(s.parent_ids));
