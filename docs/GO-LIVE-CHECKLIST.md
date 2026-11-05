# LV People – first client go-live checklist

## Before the client
- [ ] Payroll rates (PF, ESIC, PT, TDS) checked by the CA (Payroll > Statutory rules).
- [ ] Hosting decided: Netlify credits are low; Cloudflare Pages is free for commercial use.
- [ ] Demo passwords changed (E001–E004, E018 and the platform admin).
- [ ] Supabase: turn on "Leaked password protection" (Authentication > Passwords).
- [ ] Decide SMS/WhatsApp for first passwords and "forgot password" (provider + DLT registration in India).

## Create the client (platform admin)
1. Clients (live) > New client: name, company code, employee limit, modules, first admin.
2. KPI packs > choose the client > tick the KPIs one by one.
3. Give the first admin: company code, employee code, first password (changed at first sign-in).

## Client admin / HR, first day
1. Settings: company details, branches, divisions, departments, functions, designations.
2. Employees: add or import. Each new employee gets a login; the first passwords are shown once – hand them over.
3. Time Office: shifts, shift assignment, holiday calendar, attendance policy (late rule, sandwich).
4. Leave: leave types and balances.
5. Payroll: salary structure, statutory assignment (PF, ESIC, UAN, ESIC no.), bank details.
6. PMS: assign the KPIs of the pack to designations or people.

## Every month
1. Time Office > Process attendance.
2. Payroll > Monthly variables > Generate.
3. Payroll > Run payroll; Admin approves.
4. Download the bank file, ECR and ESIC files.
5. Platform admin: Clients (live) > Backup – keep the file safe.

## Known gaps (not built yet)
- SMS / WhatsApp / email sending (passwords, OTP, alerts).
- KPI scores are worked out for the current month only; month-end freeze is still to decide.
- Mobile app (the web app works on the phone browser).
