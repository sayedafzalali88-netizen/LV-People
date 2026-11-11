-- Applied on 2026-11-11 (migration org_codes_and_functional_manager).
-- A code for every organization item (unique inside a client) and the functional manager of an employee.
alter table public.job_functions add column if not exists code text;
alter table public.departments   add column if not exists code text;
alter table public.branches      add column if not exists code text;
alter table public.divisions     add column if not exists code text;
alter table public.sub_divisions add column if not exists code text;
alter table public.designations  add column if not exists code text;
-- existing rows got FN001, DP001, BR001, DV001, SD001, DG001 ... in the order of num_id, per client
create unique index if not exists job_functions_client_code_uq on public.job_functions (client_id, code) where code is not null;
create unique index if not exists departments_client_code_uq   on public.departments   (client_id, code) where code is not null;
create unique index if not exists branches_client_code_uq      on public.branches      (client_id, code) where code is not null;
create unique index if not exists divisions_client_code_uq     on public.divisions     (client_id, code) where code is not null;
create unique index if not exists sub_divisions_client_code_uq on public.sub_divisions (client_id, code) where code is not null;
create unique index if not exists designations_client_code_uq  on public.designations  (client_id, code) where code is not null;
alter table public.employees add column if not exists functional_manager_id uuid references public.employees(id) on delete set null;
