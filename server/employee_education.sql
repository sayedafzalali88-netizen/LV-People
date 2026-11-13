-- Applied on 2026-11-13 (migration employee_education): the highest education of an employee (chosen from one list) and an optional course or stream.
alter table public.employees add column if not exists education text;
alter table public.employees add column if not exists education_detail text;
