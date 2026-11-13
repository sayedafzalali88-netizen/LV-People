-- Applied on 2026-11-13 (migration employee_education): the highest education of an employee (chosen from one list) and an optional course or stream.
alter table public.employees add column if not exists education text;
alter table public.employees add column if not exists education_detail text;
-- The edge function portal (version 7) also takes the highest education (edu) and the course or stream (edu2) from the career page and the joining form; the education is checked against the one list of the ERP.
