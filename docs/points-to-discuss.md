# SEVENTH LIST (2026-10-31, built, Batches 44 and 45): notifications and Support Hub
Batch 44: notification events and channels (web app plus mobile push; Email/SMS/WhatsApp only for OTP, reset and first login), per-user choices and do-not-disturb, devices, reminder and escalation by SLA-040. Batch 45: Support Hub after Reports in the sidebar. Tabs: Raise Ticket, My Tickets, Track Request, HR/IT/Admin Support queues (shown to role holders), Grievance (role holders only, anonymous allowed, hidden from the accused and their reporting line), Knowledge Base, Feedback & Rating. Levels are unlimited per type; each level is a Role (Roles master, by branch/division of the raiser) and a TAT chosen from a list; TAT is in full hours; SLA-041 holds priority factors, auto-close days (3), credit for self-escalation (50%) and KPI limits. Late = auto-escalated; self-escalated with remarks = part credit; Escalation % KPI-387 and rating KPI-388 are new. Grievance "against an employee" mirrors into the old complaints register so KPI-023 is unchanged. Core Setting > Support > Support setup manages types, levels and TAT list.

---

# SIXTH LIST (2026-10-31, built, Batch 39): Stock audit and KPI-029
Audit maker (Admin/HR or people added in Settings > Stock audit setup) types items with system quantity (no stock data in the product); the division manager counts blind with an optional photo; difference above SLA-039 tolerance (default 2%) asks for a reason; above the Show Cause limit (default 2%) a Show Cause Notice goes out; the maker accepts or asks for a recount. KPI-029 is now Auto: items within tolerance / items audited; no audit = not counted. No random auto-audit (no stock data). Also 181 KPI from the Laxmi Excel were added as KPI-206..386 (Manager Scoring); 48 doubtful ones were left out by the user's decision.

---

# FIFTH LIST (2026-10-31, built, Batch 38): Alteration jobs
Public link #alteration (no login; salesman types code; picks tailor). Job moves: tailor enters start/end at day-end (no device needed at the counter), the tailor's reporting manager marks Delivered or Redo (shown in the manager's Inbox). Products and job types (standard time, promised hours, versions by date) are in Settings > Alteration setup. Complaint register is new, inside the Alteration tab (not the CRM employee-complaints one). KPI-202 delivered on time, 203 jobs vs capacity (method A or B), 204 complaints, 205 redo %. Dummy tailors: Salim Ansari, Rashid Qureshi (designation Tailor, manager Amit Khan). SLA-038 holds shift minutes, productive %, target, limits.

---

# FOURTH LIST (2026-10-31, built, Batch 37)
C1 employee drop-downs become a type-code-or-name box. C2 priority Critical/High/Medium/Low (also on To Do items). C3 KPI-006 now Auto from the daily To Do work: a day with any item not done that day scores 0. C4 KPI-201 Big Bill: daily import (Date, Emp Number, Name, Division, Highest Bill), topper of the division that day = 100%, others own/topper, no row on a working day = 0, no bill cap, month score = average of days.

---

# THIRD LIST (recorded 2026-10-31). Discuss, then build.

B1. Rename the Decision Register module to "My Assignment", keep its items, and add "Task Assignment": an employee assigns a task to another employee and sees the tasks given to him; when a task is completed it goes to the assigner for confirmation.
B2. Add "To Do List" in the same module, three columns like the HROne board (To Do, In Progress, Done). The employee makes his own list and moves items on, and records a work log on an item, because work often takes more than a day.
B3. HR template of mandatory daily work with the designations it is for. Every day the system puts that work on the matching employees' To Do list.
B4. Every employee sees his own log history (what happened when), and HR sees everyone's.
B5. If a Warning Letter or Show Cause Notice is pending in an employee's inbox, his salary is not processed until he acknowledges it.
B6. Warning letter automation: leave taken without applying, or lates above the SLA limit, issues a letter automatically.
    DECIDED (A-E): any employee can assign a task to any active employee; daily template work is not made on weekly off, holiday or leave days; only the employee with an unacknowledged Warning Letter or Show Cause is held out of payroll; the limits live in the SLA (SLA-037: lates default 3, absence without leave default 2) and are the same numbers Counselling uses; the letter goes out directly after every N, when the N+1th happens, once per level per month; HR and the reporting manager are notified.
    ALL SIX BUILT (2026-10-31, Batch 36), waiting for the user's review. Held employee is paid automatically once the letter is acknowledged, even after the month's run.

---

# SECOND LIST (recorded 2026-10-28, review round). Discuss point by point first, then build.

A1. In Process attendance, an employee who is held because of a pending task: HR can click on that employee and approve the pending items from there.
    DECIDED (A1): HR can approve or reject any pending request of a held employee, even one still with the reporting manager; then a reason is needed and the log says HR acted for the manager. When the last pending item is cleared the employee is processed automatically without touching the others.
A2. A Location Request must exist in the Time Office.
    DECIDED (A2): a Location Request is a request to punch attendance from outside the branch geo-fence (field or client visit). It is for a number of days (from and to dates), not hours. Approval runs through the workflow engine: the reporting manager first, then the engine's next step (HR).
A3. If an employee works on a holiday or weekly off, extra pay must be generated; how many days of extra pay is set in the SLA.
    DECIDED (A3): extra pay for work on a holiday or weekly off is on top of the normal salary of that day. The SLA has separate values for weekly off and for holiday (days of extra pay), plus the minimum hours for a full day and for a half day; a half day earns half. The per-day rate is fixed salary divided by the days of the month. The system lists these days from the punches and HR or the manager approves them before they go to payroll.
A4. Overtime must be calculable, with an hourly report.
A5. When overtime is approved, the hourly amount by the employee's shift is added to the salary of that month.
    DECIDED (A4, A5): overtime is hours worked after the shift end. The hourly rate comes from the shift: fixed salary divided by (days of the month times shift hours). The SLA holds a multiplier (default 2x, and a separate one for weekly off and holiday), the minimum overtime minutes (default 30) and the rounding (default 15 minutes). Only employees HR marks eligible earn overtime. The system lists overtime from the punches; approval is the reporting manager and then HR through the workflow engine. Approved overtime is added to that month's salary, and there is an hourly overtime report.
A6. Leave must have Short leave, with a limit that HR sets.
    DECIDED (A6): Short leave is hours, not a full day. HR sets three limits in the leave policy: the most hours in one short leave (default 2), the most short leaves in a month (default 2) and the most hours in a month (default 4). It is paid and cuts nothing while inside the limits; a request over a limit is not allowed. Only the reporting manager approves it.
A7. After applying for leave, the employee can cancel it.
    DECIDED (A7), to be confirmed: a pending leave is cancelled directly by the employee. For an approved leave that has not started, the employee sends a cancellation request and the reporting manager approves it; the balance returns on approval.
A8. Most important: a report for everything. In Reports, pick a module, and HR or anyone authorised can take the report. The same report must come from the module page itself and from the Reports section.
    DECIDED (A8): reports show as a table on screen, download as CSV, and print as a clean page that can be saved as PDF. Common filters: month or date range, branch, department, designation and employee, plus report-specific ones. Each module has its own Reports right (View and Export separate) in the role access. A manager sees only his team; an employee only his own. The same reports are in the Reports section (choose a module) and behind a Reports button on each module page.
A9. When a module is clicked, its inner sections should show. The left sidebar is now too long.

    DECIDED (A8, cont.): build order is the report frame first (Reports section, module Reports button, filters, CSV, print, rights), then Time Office, Leave, Payroll and Employees, then the other modules. The module report list as proposed in chat.

    DECIDED (A9): the module headings in the sidebar (Time Office, Workforce, PMS, Stock Management, Administration) are clickable. Clicking one opens or closes the pages under it. Only one heading is open at a time and the heading of the current page opens by itself (my default, the user did not object). Single pages (Dashboard, Inbox and so on) open directly.
ALL NINE POINTS OF THE SECOND LIST ARE BUILT (2026-10-28), waiting for the user's review and corrections. Earlier note: ALL NINE POINTS WERE DISCUSSED. Proposed order: A9, then A1, A2, A6, A7, then A3, A4, A5, then A8 (reports).

---

# Points recorded for discussion (recruitment to payroll) - FIRST LIST, all built

Status: recorded on 2026-10-28. All ten points are now discussed and the decisions are noted under each point. Nothing below is built yet except points 4 and 6. Waiting for the go-ahead to develop.

BUILT on 2026-10-28: all ten points (4, 6, 8 earlier; 9, 10, 7, 1, 2, 3 and 5 now). Waiting for the user's corrections after review.

Point 10 decided: HR publishes payslips for all employees at once, or for chosen branches or employees. Payroll must be run, but payment is not needed. HR can unpublish with a reason, and the employee gets a notification.

1. Manpower plan drives requisitions. When a plan row is short, a requisition is created automatically and shown. HR can also raise a new requisition by hand. A designation must first be added to the manpower plan (through the approval flow) before a requisition can use it. The reporting manager can also raise a request on a shortage; it goes ahead to recruitment only after HR approval.
   DECIDED (point 1): auto requisition is created both when a plan is saved with a shortage and when an employee leaves and a shortage arises; one open requisition per designation and branch; the whole shortage goes in one requisition; the approval runs through the workflow engine.
   DECIDED (point 1, cont.): a new plan row has its own workflow approval, separate from the requisition approval. The reporting manager sees only the shortage against the approved plan. If he needs extra manpower beyond the plan, he raises a separate additional-manpower request; it goes through the workflow engine, then reaches HR, and HR adds it to the manpower plan and starts hiring.
2. A requisition must have its manpower plan row. The manpower plan row also carries the CTC.
   DECIDED (point 1, cont.): when HR adds the additional row that the manager's approved request asked for, it counts as approved; no second plan approval.
   DECIDED (point 2): the plan row's CTC comes from the salary structure of the designation and the level chosen on the row (L1 for hiring); HR only picks the level.
   DECIDED (point 2, cont.): at offer time HR may pick any level, with no approval; the plan's level is only the default.
3. A link that a candidate can share and open to apply by himself. Only a few fields: basic information, expected salary, current salary, experience.
   DECIDED (point 3): one common link that doubles as the career portal; the candidate selects the vacancy. Fields: select vacancy, name, father name, mobile number, address, years of experience, current salary, expected salary, resume (optional). No OTP. One application per mobile number.
4. (Fixed on 2026-10-28) Offer takes a career level; CTC comes from the salary structure.
5. Employee seat: a company can join an employee beyond its limit, but the SaaS console must show which company is over its limit, and billing must be generated accordingly.
   DECIDED (point 5): billing is the plan's base fee (covers the employee limit) plus an extra rate for every employee above the limit; the count used is the peak number of employees in the month.
   DECIDED (point 5, cont.): a hard upper limit above the plan limit (for example limit plus 20%); the SaaS owner can change it; joining stops beyond it. The SaaS console makes a quotation; when the quotation is final the client company is created from it and billing follows the quotation. The bill follows Indian rules (GST etc.) and shows base fee and extra employees separately.
   DECIDED (point 5, cont.): the billing cycle (monthly, quarterly or yearly) is chosen in the quotation, and extra employees are counted from the peak in each cycle. The quotation may carry an optional one-time setup or implementation charge as a separate line with its own GST. Invoice: GSTIN and state of both parties, place of supply, GST 18% (CGST+SGST in the same state, IGST otherwise), SAC code, invoice number series, dates, due date, amount in words; base fee and extra employees shown on separate lines.
6. (Done on 2026-10-28) All gaps found while walking the flow: level-wise offer and join, real gender and date of birth at join, real shift and salary-structure checks in onboarding, proration for a mid-month joiner.
7. Statutory (PF, ESIC and the rest) should be assignable per employee like the salary structure. If an employee is not to be covered by PF or ESIC, nothing should be deducted.
   DECIDED (point 7): each employee gets a statutory assignment (PF, ESIC, PT, TDS, LWF applicable yes or no, with effective date, reason and who did it). By default nothing is assigned; HR must assign each employee, and until then the onboarding statutory step stays open. An assignment or change goes through a second approver in the workflow engine.
   DECIDED (point 7, cont.): PF base is chosen per employee, either up to the wage limit or on the full basic. For ESIC the HR assignment rules; if earnings are above the ESIC limit the system only shows a warning and does not stop the deduction.
8. Explain how variable pay is calculated, for example PGP of 2,000.
9. Payroll attendance as in HR One: the Time Office has two steps. (a) Calculate attendance correction arrear: if an earlier month's attendance was corrected, it creates an arrear. (b) Process attendance: the actual month.
   DECIDED (point 9): the Time Office has two steps. Process Attendance finalises a month for each employee (present, weekly off, holiday, leave, loss of pay) and locks it; payroll uses only this. Calculate Attendance Correction Arrear looks at earlier, locked months whose attendance later changed and works out the arrear as that month's fixed salary divided by that month's days, times the changed days. The arrear goes to Additions and deductions and needs a second approver.
   DECIDED (point 9, cont.): Process Attendance is held back only for an employee who still has a pending leave or regularization request in that month; every other employee is processed. A correction that increases loss-of-pay days makes a negative arrear (a recovery), which also needs a second approver.
10. Payslips become visible to the employee only when HR publishes them.

## Eighth List - Expense Advance + Expense Reimbursement Claim (discussion, NOT built; user will add more)
Expense Advance (employee gets money first, settles with bills later):
- Types master with limit (admin can add any type, raise/lower limit, per designation/level optional).
- Approval: all levels of the workflow, no amount slab.
- Employee enters settlement due date at apply time (accountability).
- Old unsettled advance does NOT block new request; request goes to approver with a clear "old advance pending" warning; repeated reminders to employee (Inbox/bell/push) and manager. No warning for Accounts needed.
- After approval: Accounts role holder (Roles master, branch/division mapped) disburses: Bank (UTR) or Cash (hand-written voucher details, no limit). Then close.
- Settlement via Expense Report (multiple bills, bill required for every amount), submitted by employee. Report is for one thing only (advance OR claim, never mixed).
- Late settlement: reminder + escalation only (no salary deduction, no refund/extra-claim auto flow needed).
Expense Reimbursement Claim (separate module; employee spends first): Expense Report with multiple bills, workflow approval, Accounts pays Bank/Cash, per-bill reject/reduce, type limits, duplicate-bill check, submit-within-days policy.
KPIs: map KPI-223 (Claims within TAT) to Auto; new KPIs agreed: on-time advance settlement % (late settler's score drops), Accounts disbursement TAT, rejected-bill %.

## Ninth List - Biometric / API attendance integration (Batch 46, built in prototype)
- Client uses eSSL eTimeTrackLite (MS SQL database on its server, machines push to it). Real connection needs a live server: Bridge program (read-only DB user, SQL port never opened) or machine ADMS push; both simulated in prototype.
- Core Setting > Integration: Biometric sources (4 ready connectors + 3 planned), Devices (auto-found by serial, offline alert SLA-042 hours), Employee IDs (biometric ID, fallback Emp Code / number part), API guide + test call, Punch log + CSV import.
- One door bioIngest: API, bridge, push and file all end there; duplicate punches ignored in a window; unmatched IDs kept and re-matched later; first punch = in, last = out; rule: machine or app wins; attendance source shows Biometric.
- HR Inbox items (device silent, unmatched IDs), reports bio_punch and bio_dev.
- Open: client's eSSL vendor API/permission, sample punch export file, branch/device names, real server for the Bridge and API.

## Tenth List - Attendance day rules, WOP / HP, missed punch tool (Batch 47, built in prototype)
- Biometric days are now judged when read (dayStatus) with the shift of that day and SLA-043: full day, Half day (HD), Absent, Weekly off present (WOP), Holiday present (HP). Late is never marked on a weekly off or holiday.
- Only one punch = Absent (missed punch) until corrected. Today with one punch stays Present (day not over).
- SLA-043: full-day hours 8, half-day hours 4 (below = Absent), late over 120 min after shift start = half day, early going over 120 min = half day, early-going flag 15 min, KPI limits (early 3 days, missed punch 2 days), reminder window 7 days. WOP/HP need the half-day hours of SLA-035 (4h); below that the day stays WO / Holiday.
- Half day = half present + half LOP (Process attendance, lopFor, arrears use 0.5). WOP/HP counted inside WO/Holiday columns and shown separately.
- Time Office > Punch exceptions: list (missed punch, short duty, half day, leave-day punch, early going), Correct with reason (ACORR, optional "count as full day"), log, employee told, Process shows "process again" banner. Inbox for employee and HR, reports att_exc and att_fix.
- New KPIs: KPI-389 Early Going Days, KPI-390 Missed Punch Days (not yet assigned to designations).
- Open: Process attendance still counts only the running month; night shifts and lunch punches not handled; punch on an approved leave day stays Leave and is only listed.

## Eleventh List - HR Desk (name to be chosen, e.g. Command Center) - DISCUSSION, NOT built
- One place for HR work, own sidebar item, only for people given the right (matrix row per tab, view / edit, plus scope branch / division, salary tab separate and masked).
- Home: employee search (name, code, designation, email, phone, filters) + recent searches + Actions and Imports buttons top right + app shortcuts.
- Employee 360: Profile, Attendance (calendar, YTD counts, exceptions), Salary YTD (financial year Apr-Mar, months across, heads down: Basic, HRA, Special, Total earnings, PF, VPF, ESI, LWF, PT, TDS, Total deductions, Net; tabs Salary / Reimbursement; download), Leave, Performance, Requests and history timeline. All kinds of correction from here, through the existing workflows and rights, audited.
- Actions tab: every module's actions in one grouped list (Recruitment, Workforce, Time Office, Payroll, Expense, Performance, Engage, Asset, Helpdesk), search, pin favourites, recent actions; each action keeps its own right. Imports tab: all imports of all modules in one place with templates and history.
- Insights: where is what pending (by module, stage, who holds it, age) plus history, HR analytics and reports.

## Twelfth List - Holiday calendar in Core Setting + Leave types with paid / unpaid (DISCUSSION, NOT built)
- Now: Holiday bank and Holiday calendar live only in Time Office tabs; only the company-wide calendar feeds attendance. Leave types are fixed in code (CL 12, SL 8, EL 15), no master, no paid / unpaid setting.
- Wanted: HR makes the whole year calendar in advance in Core Setting; leave types and their benefit (paid or unpaid etc.) set from a master.
- Cockpit (HR Desk) agreed: name Cockpit, 3 parts (shell + Employee 360 with Salary YTD, Actions + Imports incl. employee bulk upload, Insights); waiting for the user's "haan" and whether all 3 parts or only part 1 first.

## Thirteenth List - Time Office Setup in Core Setting, leave types, holiday calendars, leave and pay rules (Batch 48, built in prototype)
- Core Setting > Time Office Setup: Shifts, Holiday bank, Holiday calendar (moved from Time Office), Leave types, Leave and pay rules.
- Leave types master (editable, add new): CL 12, SL 8 (proof from 3 days), EL 15, Maternity 182 (women, counts every day), Paternity 5 (men), Comp-off (balance given by HR), LWP (unpaid, no limit), Marriage 5 (once in service), Bereavement 3. Per type: paid / unpaid, quota fixed once for the leave year (April to March), eligibility (gender, probation SLA-044, designations), max days, notice, proof, sandwich mode. HR can add or cut a balance with a reason.
- Paid leave = LV; unpaid leave = new status LWP, counted as loss of pay in Process attendance, lopFor and arrears.
- Sandwich rule (company switch + per type override); optional rule: if present days of the month are below N, weekly offs become unpaid (paid leave counts as present, holidays optional, prorated for a joiner and for a running month).
- Holiday calendar: company, branch, state, zone, division; most specific one wins per employee (branch > zone > state > division > company); copy to a new year, add many (paste), activate / inactivate; attendance, shift OT, restricted holiday and the leave page use the employee's own calendar.
- Not built (no year-end engine): carry forward, encashment, half-day leave. Zone calendars wait for zone master data. Cockpit (3 parts) still waiting for the user's go-ahead.

## Fourteenth List - Self Training (Batch 49, built in prototype)
- Training > Self Training (employee), Courses, Assign courses, Learning progress (rights page "learnmgr", HR/Admin by default, can be given to a trainer role in the rights matrix).
- Category > sub-category > course > lessons in order (video link, reading, test). A lesson opens only after the one before is done. No self-enrol: HR assigns by employee / designation / career level / branch / division / new joiners, mandatory or optional with last date (reminders and escalation use SLA-040).
- Video done after the minimum percent (default 90, SLA-045) is watched; prototype counts page time (+60 s helper is prototype only); reading needs minimum reading time and "I have read". Tests: pass 50 percent (SLA-045), unlimited tries, own seconds per question, wrong answers shown with the right one. Question bank shared with classroom tests.
- Certificate on course completion (series CRT/FY/SEQ, printable). Knowledge profile (skills with level) in My Profile and Cockpit. Promotion: courses needed per career level (Assign courses tab); careerOf shows "Courses pending" until done.
- KPIs: KPI-391 mandatory courses on time %, KPI-392 test score average, KPI-393 learning hours (not yet assigned to designations). Reports: progress, certificates, skills. Inbox + notification category "Self training".

## Fifteenth List - Cockpit (Batch 50, built in prototype)
- Sidebar item Cockpit (after Dashboard). Rights pages: cockpit + ck_profile, ck_att, ck_salary, ck_leave, ck_perf, ck_hist, ck_act, ck_imp, ck_ins (View / Edit each) and a scope per role (all / own branch / own division / own team / self) in Core Setting > Automation > Access rights.
- Search: name, code, designation, email, phone + filters, recent searches, finds actions, pages and reports too. Employee 360: Overview, Profile (masked, full numbers logged), Attendance (calendar, year counts, punch exceptions with Correct), Salary YTD (financial year, months across, salary and reimbursement tabs, cell detail, download, print; estimate for months payroll was not run), Leave (balance, history, leave on behalf, approve), Performance, History. "Cockpit" button on the Employees page.
- Actions hub (grouped by module, search, pin, recent; not-built ones show Coming soon), Imports hub (attendance, punch log, KPI data, business data + new Employee bulk upload with first login), Insights (pending board with age and who holds it, history from audit, HR analytics).
- Also fixed an old bug: Location request "New request" button opened the location master modal (name clash); now locReqModal.

## Sixteenth List - Expense module (Batch 51, built in prototype; completes the Eighth List)
- Sidebar Expense (after Payroll). Tabs: My advances, Reports and claims, Approvals, Accounts desk (Accounts role holders; others only look), Register (HR). Core Setting > Expense Setup > Expense types (any type, advance limit, limit per designation, one-bill limit). SLA-046 for days and limits.
- Expense advance: employee gives the amount, purpose, needed-by and his own settle-by date (max 30 days). Old unsettled advances do not block a new one; the approver sees a warning, the employee and manager get repeated reminders (every 3 days) plus Inbox due-date escalation. Approval = every level of workflow WF-017 (Task automation TA-12), no amount slab. Then Accounts (Roles master, role ROL-006, default holders Neha Gupta and Priya Verma) disburses by Bank (UTR, proof, duplicate UTR blocked) or Cash (hand-written voucher number, no limit). Employee then gives an Expense report (many bills, every bill needs vendor, bill number and file, one-bill limit by type, duplicate bill blocked); Accounts checks bill by bill, can send back, then settles. Balance (unspent or spent more) is only recorded with a note, no refund or salary cut.
- Expense claim (reimbursement): report of bills (within 30 days of bill date), WF-018 approval where each approver can reduce or reject a bill, then Accounts pays (Bank or Cash). A report is either an advance settlement or a claim, never both. Rejected claim can be reopened to correct.
- KPIs: KPI-223 now Auto (Accounts: claims paid and advances disbursed within TAT), KPI-394 advance settled on time % (late settlers score less), KPI-395 advance disbursement TAT, KPI-396 bills rejected %. Reports: register, unsettled ageing, payment register. Cockpit: expense actions live, Reimbursement tab, pending board and history show expense.
- Payments of this module are kept in the Expense payment register, not in the Payroll payments register. Per-bill editing is in the Expense Approvals tab; approving from the generic Inbox approves as submitted. Travel request stays Coming soon. Real file upload of bills is for the server development.

## Seventeenth List - Travel request and Travel Policy (Batch 52, built in prototype; from "Travel Policy LV.docx")
- Policy read: approval before travel (by level), 8 grades (designations, air / road / train class, lodging limit and daily allowance by city class A / B / C), city classes, own vehicle Rs 2.80 and Rs 11 a km, 50 km local, no DA inside the city, own food up to 70 km, meal allowance 8-12 h Rs 120 and 12-24 h Rs 180, 10 days notice, original bills in company or employee name, work on Sunday or holiday only with prior approval, expense form within 3 working days, claims paid on the 16th to 20th, travel advance must be settled, rejection and discipline for fake bills. Grade numbers jump from 5 to 7 in the file.
- Core Setting > Expense Setup: Grades and limits (editable: designations per grade, classes, lodging and DA by city class, approval workflow per grade), City classes (A and B lists, others C), Rates and rules (notice days, report days, km rates, local and own-food km, meal slabs, payment dates, four-wheeler rule, policy text shown to employees).
- Expense > Travel: request with live estimate and policy checks (grade, city class, air not allowed, short notice, four-wheeler, Sunday and holiday), workflows WF-019 / WF-020 / WF-021 by grade (grade 1 needs none), approved trip makes the days On duty in attendance (WOP / HP on a weekly off or holiday), advance from the trip (settle-by = 3 working days after the trip), trip report mandatory before the advance bills or the claim, claim from the trip, change (needs re-approval) and cancel with reason. KPI-397 trip report on time %. Report: Travel requests. Cockpit action live.
- Open: designations with no grade count as the lowest grade; the file's levels (E1-E7, M, L, S, T) are not in the ERP so approval is mapped by grade; Sunday and holiday trip days are shown as WOP / HP but give no automatic extra pay.
- Update (Batch 52b): the travel grade of an employee now comes from his ERP career level L1 to L12 (e.level). Each grade lists its career levels in Core Setting > Expense Setup > Grades and limits; a level can be in one grade only. Order: career level, then the grade's fallback designations, then the lowest grade. Default levels (higher number = more senior): G1 L12, G2 L11, G3 L10-L9, G4 L8-L7, G5 L6, G7 L5-L4, G8 L3-L1 (editable). Approval workflow stays per grade.

## Eighteenth List - My Requests, Resignation, Exit Interview, target vs achievement on the Dashboard (Batches 53 and 54, built in prototype)
- My Requests (sidebar, under My Profile): every request of the employee in one list with status and who holds it, and "new request" buttons for Leave, Short leave, Regularization, On duty, Location, Restricted holiday, Salary advance, Expense advance, Expense claim, Travel and Resignation. Support tickets stay in Support.
- Resignation: employee gives the last day he asks for (default notice period from Core Setting) and a reason; workflow WF-022 (Reporting Manager, HR Manager; Task automation TA-14); approved = last working day fixed, exit interview task made; HR can change the last day or record an exit directly (Exits page); the employee is relieved automatically after the last day. Withdraw before approval is free; after approval it needs HR's allowance. Leave is not allowed in the notice period (own leave apply; HR on behalf is not blocked).
- Exit interview: new role Exit Interviewer (ROL-007, default HR Manager). Template in Core Setting > Templates > Exit interview (questions with type, who asks it: exit interviewer or reporting manager, required, tags for main reason / recommend / rehire; reasons list; templates per designation, level, division, branch; default one). The interviewer and the reporting manager fill only their own part; the manager cannot read HR answers; reasons shown only after 3 interviews and groups of fewer than 3 are hidden. Final and Full Settlement shows only a warning. Rehire answer shows on the Recruitment candidate who is a former employee (matched by mobile or email). KPI-398, reports Resignations and Exit interviews, Cockpit timeline and pending board.
- Quantity: Employee Daily Sales and Division Daily Sales (Till Date) imports now need "Till Date Qty"; Business data reports have a Quantity field; average per piece = sale / quantity (old data shows a dash). Daily till-date rows are kept as history.
- Dashboard: Division card (target, achieved, %, due by today, left, days left, needed today, done today, average per piece, last 7 days), personal target card and category targets, manager sees team personal targets, HR and Admin see all divisions and who is behind. Colour by pace (SLA-048: green at 100, yellow at 80). Employee sees only own personal target and own division.
- Update (Batch 53b): the resignation form follows the user's sample: Notice period (in days, from Core Setting, read-only), Last Working Date (LWD) = today + notice, shown with the calendar day, Reason (list, required), Proposed LWD (date, required), Comment (required), Attachment (file name, optional; real upload in the server development), Submit. A proposed LWD before the notice end shows a note that HR decides. The record keeps notice, policy LWD, proposed LWD and attachment; HR sees them in Exits.
- Update (Batch 54b): the Dashboard is split into three tabs: My Performance (KPI tiles, growth, strong and weak KPIs; for HR and Admin the people tiles), My Target (the target vs achievement cards, compacted), and Today and requests (approvals, quick actions, requests, leave balance, birthdays, holidays, announcements). Measured at 1366x768: My Performance and My Target fit without scrolling for every role; Today and requests still scrolls for manager, HR and Admin.

## Nineteenth List - Birthday and work anniversary wishes (Batch 55, built in prototype)
- The Dashboard card (Today and requests tab) now reads the real date of birth and date of joining: today and the next 7 days, company-wide (day and month only), with work anniversary years. The two hard-coded names are gone.
- A Reporting Manager sees a separate "My team" block first (direct reportees), plus a daily notification about the team members whose day it is.
- Wish: a "Wish" button on the day itself; the employee picks one ready message (no free text), it reaches the person as a notification (bell and Inbox only), one wish per person per kind per day; the person sees "N colleagues wished you" with names and messages. Own card "Happy Birthday" or "Happy Work Anniversary".
- The company greeting goes by itself to the person on the day (on or off, English and Hindi text). Core Setting > Templates > Greetings holds the ready messages (birthday and anniversary, add, edit, delete) and the two company greetings. Notification category: Birthday and anniversary wishes.
- Demo dates were changed for a few employees so the card has people (E006 birthday today, E005, E009, E011 birthdays soon, E007 anniversary today, E004 anniversary in 2 days).


## Twentieth List: Today's Challenge (built, Batch 56)
- New tab "Today's Challenge" (आज की चुनौती) in My Assignment, after Task assignment.
- Only the Reporting Manager (direct team only) creates it; only the Manager enters counts (cumulative, with a time).
- Bills and/or quantity goal, up to 4 checkpoints in 12-hour time, final goal, start date + repeat days, text-only reward (a "Reward given" tick, no accounting).
- Templates (3 built in + save my own), "select those behind their personal target" helper, nudge messages (ready lines or own words), Repeat / End.
- Ranking = today's achievers only. Employee sees own card, checkpoint ticks, streak, earlier days, and a one-line summary on the Dashboard My Target tab.
- Notification category "Today's Challenge" (key prefix CH|), report "Today's Challenge results". No effect on KPI, payroll or attendance.
- Not built (server phase): live count from billing software, day-end reconciliation with imported bills (bills history is not stored yet).


## Twenty-first List: Asset Management (built, Batches 57-58)
- Batch 57: Inbox chips now filter the list; Task, To Do and Today's Challenge items also come to the Inbox.
- Page "Assets" (Admin/HR): Inventory (Asset name, Product, Type, Sub-type, serial, value, warranty, add many at once), Employee assets, Requests, Exit handover, Types. Page "My Asset" (everyone): my assets, my requests, request button.
- Types: Mobile, Electronic, Vehicle (editable with sub-types). Uniform is NOT an asset.
- Request (new or replace) goes through workflow WF-023 (Reporting Manager, then HR Manager); return request needs no approval. After approval the Asset In-charge (role ROL-008, default HR) issues an item.
- Last step is the employee's acknowledgement ("I received it" / "Not received"); item is "Awaiting acknowledgement" until then. SLA-049: days to confirm (default 3), late ones show in the In-charge Inbox.
- Exit: resignation approval tells the employee and HR which assets must come back; Exit handover tab, warning in final settlement; receive back as Good / Damaged (goes to repair) / Lost. No salary deduction.
- Also: My Requests shows asset requests, notification category Assets, reports Asset inventory and Assets with employees.
- Not built: employee-to-employee transfer, designation-wise entitlement, bill/photo upload (server phase), Asset In-charge who is not Admin/HR cannot open the Assets page until the rights matrix gives it.

## Twenty-second List: Analytics module (Batch 59)
- New subscribable module "Analytics" (page `analytics`, own rights row per module tab: an_emp, an_pay, an_time, an_leave, an_rec, an_trn, an_pms, an_exp, an_ast, an_exit). In plans Performance and Complete.
- Page: strip of module names on top (Overview, Employees, Payroll, Time Office, Leave, Recruitment, Training, Performance, Expense, Assets, Exits). Overview shows KPI tiles and one card per module. Clicking a module shows all its dashboards (56 in all).
- Every dashboard: Table / Bar / Stacked / Pie / Line switch, Full view, row click drills down to the employee list, CSV export (per dashboard and per module), Print / PDF (browser print). Filters: branch, division, month (payroll).
- Charts are drawn by hand in SVG, no library.
- Visibility: tab shows only if the client has that module and the user has the right. Manager sees own team only, no Payroll/Recruitment/Assets/Exits tabs, no category dashboard. Category (caste) dashboard is Admin/HR only.
- Ready reports asked: branch-wise and division-wise total/male/female/%, category-wise, division-wise shift, division-wise weekly off, marital status, performance (KPI), payroll cost by division/branch, per-employee cost, recruitment, training.
- Employee profile new fields: Category (private), Marital status, Weekly off (blank = shift roster), Emergency contact 1 and 2. Shown in the Personal tab; Aadhaar/PAN stay masked in the Statutory tab.
- Left for later: custom dashboard builder ("My dashboards"), scheduled reports, real PDF, employee self-fill of emergency contact with HR confirmation, bulk-upload sample with the new fields, KYC document upload (server time).


## Twenty-third List: Engagement, Letters, Cockpit, Policy, Theme, Employee self service (Batches 62-72)
- Engagement (Batch 62): Notice board, Polls, Letters tab, More; audience picked with dropdowns (Function, Branch, Division, Department, Designation, Specific employee), chips, empty = everyone.
- Letters (Batches 63-64): 12 types with one number series and a code per type (ORD, OOR, NOT, CIR, NTF, MEM, OMM, ADL, INS, REM, APV, RCM); HR/Admin/Managers create; manager letter goes to HR, HR letter to Director (WF-024/025); PDF after issue; letterhead (Admin) and "Signed by" on every letter. Logo and signature images are server time.
- Cockpit (Batches 65, 69, 70, 71): Actions and Imports got Engage, Asset, Analytics and Challenge actions plus Employee-details and Asset-inventory imports. Employee 360 tabs: Overview, Profile, Documents, Attendance, Salary (payslip download row under Net take home), Advance, Leave, Expense, Assets, Training, Letters, Performance, Exit, History. Requests tab for HR (profile change approvals). "Mark exit" button on the Exit tab (Exits Edit right only).
- Attendance policy (Batch 66): Core Setting > Time Office Setup > Attendance policy. Every N late = X day LOP (default 4 = 0.5), absence without application = 1 day LOP, weekly off or holiday between two absent days unpaid, leave sandwich rule, minimum present days; policies by audience with an "applies from" date; Process attendance shows Absent, Late (cut), LOP and Paid days; Late Arrival report and date-wise report. Not built: leave-balance-first option, sandwich across month end.
- Theme (Batch 67): Admin only, Core Setting > Appearance. Teal Night + Gold, Indigo Royal, Midnight Navy + Mint, with Auto / Light / Dark. Kept in the browser in the prototype, company setting at server time.
- PAN, Aadhaar, UAN, ESI and bank account: masked with Show / Hide; Admin, HR and the employee can show; every look by Admin/HR is logged (Batches 68, 72).
- Employee self service (Batch 71): My Profile > Update my details. Contact and address change at once (HR told, audit log). Emergency contacts, Bank details, PAN/Aadhaar, Name/DOB, new documents go to the HR Manager through workflow WF-026 (type Profile Change); bank, PAN/Aadhaar, name/DOB and documents need a proof photo or PDF (up to 1.5 MB; kept in memory in the prototype, real storage at server time). Salary keeps going to the old account until HR approves a bank change; HR approval is the verification.
- Still not built: leave encashment, carry forward leaves, process bonus, loan request, generate challan, goals and 360 feedback, invite to the app, share letters and documents (Cockpit "coming soon" actions); custom dashboard builder, scheduled reports, real PDF for Analytics; Analytics for Stock, Library and Business data; notices and polls by managers; address state/district/city change by the employee.


## Twenty-fourth List: Leave encashment, Carry forward, Bonus head (Batch 73)
- Leave setup: Core Setting > Time Office Setup > Leave types (quota, paid, who can take, sandwich). New tab "Encashment and carry forward" next to it sets, per leave type: can be encashed, keep at least N days, most days in a year, rate of a day (Basic ÷ 30 or Gross ÷ 30), carry forward yes/no and most days to carry. Default: EL encashable (keep 5, max 10 a year) and carried (up to 30); CL and SL lapse.
- Leave encashment: Leave page > "Encash leave" tab. Employee asks (days in half steps); approval WF-027 (Reporting Manager, then HR Manager). After approval the days are cut from the balance (a balance entry) and an approved payroll line "Leave encashment" goes to the first draft payroll month. A request is checked against balance, minimum to keep and yearly limit, pending requests count. Register report "Leave encashment register".
- Carry forward: done once a year by HR in the same setup tab. Preview shows closing of the last year, carried days and lapsed days per employee and leave type; Apply adds a balance entry in the new year and records it so the same employee and type is not carried twice.
- Bonus: no "Process bonus" action. New head "Bonus" in Payroll > Salary structure (Heads and components) with a % of Basic (8.33, changeable). It enters an employee's structure and payslip only when Bonus = Yes in Statutory assignment (new column and field, approved by WF-011 like PF and ESIC). It is paid every month by attendance, on top of the structure (not cut from Special Allowance), and is not in PF. Report "Bonus register" in Payroll reports.
- Not built: leave encashment at exit (final settlement), encashment of an unapproved leave year, Bonus Act wage ceiling, Bonus paid yearly instead of monthly.
- Still "coming soon" in Cockpit Actions: Loan request, Generate challan, Goals and 360 feedback, Invite to the app, Share letters and documents.


## Twenty-fifth List: UAN and ESIC number in Statutory assignment, EPFO and ESIC challan reports (Batch 74)
- Statutory assignment form: PF = Yes shows a UAN field (12 digits, required); ESIC = Yes shows an ESIC IP number field (10 digits, required). The numbers go with the request (approval WF-011 shows them in the task title) and are saved on the employee on approval, so the profile Statutory tab shows them masked as before. Numbers can still be edited in the employee Edit form.
- Reports > Payroll: "EPFO challan (ECR)" and "ESIC challan (monthly contribution)", by month, in the columns of the department formats given (EPFO Format.xlsx and ESic Format.xls).
- EPFO: UAN, Member Name, Gross Wages, EPF Wages (basic up to the PF limit, or full basic as assigned), EPS Wages and EDLI Wages (capped at 15,000), EPF Contribution (12%), EPS Contribution (8.33% of EPS wages), EPF and EPS Diff (EPF minus EPS), NCP Days (days not paid), Refund of Advances (0). Downloads: Excel (.xlsx) and the ECR text file (fields joined by #~#).
- ESIC: IP Number, IP Name (letters and space only), days paid, total monthly wages (gross), reason code for zero days (1 on leave, 2 left service, else 0) and last working day (DD/MM/YYYY, only in the month of leaving). Download: Excel (.xls, sheet Sheet1).
- Download works only after the payroll of that month is run; a draft month shows a preview. Members with PF or ESIC Yes but no valid UAN or IP number are left out of the file and named in the note on top. Excel files are made in the browser with a library from the internet (cdnjs); if it does not load, the CSV button of the report and the ECR text still work.
- Not changed: the onboarding "Statutory" step still checks only the assignment, not the numbers.


## Twenty-sixth List: Employee code format (Batch 75)
- Core Setting > Rules and numbering > Code series: new card "Employee code" above the letter series. The client picks Letters and numbers (prefix 1 to 6 letters or digits, optional "-" or "/" between, digits 1 to 8) or Numbers only (for example 1001), and the next number.
- Used when HR adds an employee (the form shows the next code), when a candidate joins, and in the Cockpit bulk import. Codes already given never change. A code is never given twice: if the next code is already used it is skipped.
- Default stays E001 style (prefix E, 3 digits). Not built: code by branch or division (for example a branch letter in the code), reset every year.


## Twenty-seventh List: All record numbers in Code series (Batch 76)
- Code series now has, besides letters, offers, certificates and the employee code, 29 more numbers in groups: Money and payroll (ADV, EXA, EXR, TRP, ENC, ADJ), Requests and approvals (PCR, AR, SL, LOC, TA, RSG, XIT), Assets (AST, AI, ASR), Recruitment and manpower (REQ, VAC, ADD, MPM), Training (TRN, OJT, IND), Operations (TKT, QT, ALT, ALC, SA, PC). WFI and TSK are system numbers and only listed.
- Each has prefix (1 to 8), format with {PREFIX}, {FY}, {SEQ} (default {PREFIX}-{SEQ}, so nothing changes until the client edits), digits, start, next number, reset never or every financial year. The next number cannot go below the current one when the format is unchanged.
- One function (sysNo) makes every number at the 35 places that used a fixed prefix before; the expense numbers go through it too. Numbers already given are never changed. The first time a series is used, it carries on from the number of records already there.
- Not changed: display ids in some timelines (LV, RH), exception log reference, seed demo numbers.


## Twenty-eighth List: Extra payroll heads, back date limits, KPI assignment reports (Batch 77)
- Payroll > Monthly payroll > "Extra heads and import": the client's own heads (code, name, earning or deduction) with three switches each: counts in PF wages, ESIC wages, TDS. Seeded: AWA (Additional Wage Allowance), ARR (Arrear), BPAY (Bonus Pay), SWEET (token money for extra sale), MREC (Misc. Recovery).
- Import: pick the head and a draft payroll month, upload a CSV (Employee Code, Amount, Remarks) with a downloadable sample. Every row needs a remark. Rows are checked (code, in this month's payroll, amount, remark, no employee twice) and a preview shows problems; good rows go straight into the salary of that month, no second approval. Re-importing the same head and month can replace the earlier lines. An import can be undone while the month is a draft. Remarks are printed at the end of the payslip with the amount. Report "Extra heads register" with Excel.
- The switches change the month's PF (basic plus those heads up to the PF limit), ESIC (gross without heads marked no) and TDS (extra tax on the taxable heads). Only imported lines follow the switches; manual payroll lines are unchanged.
- Attendance policy now has "Back date": days back for Leave (default 3), Regularization (default as SLA, 7), On duty (7), Short leave (3), counted in calendar days; and an option "employee can mark leave on a weekly off (Sat or Sun)". When off, a leave cannot start or end on a weekly off. HR and Admin can still raise a request for an employee beyond the limit. Before this, leave could not be applied for past days at all.
- Reports (PMS): "KPI assignment report (employee-wise)" one line per employee and KPI for the current period, and "(designation-wise)" with how many employees of each designation have each KPI; both export to Excel and can be filtered by branch, department, designation or employee.
- Still to discuss: 4. CCTV monitoring (division, type, positive or negative feedback, scoring, monitor completeness KPI) and 5. daily Indexing and VM photo upload with workflow approval; both are planned as one "evidence KPI" engine.


## Twenty-ninth List: CCTV monitoring and Indexing / VM photos as evidence KPIs (Batch 78)
- Rename: the observation training type "Store Discipline" is now "Division Discipline", and the KPI "Discipline / Discipline on Floor" (KPI-189) is "Division Discipline".
- My Assignment (the daily tasks page, with To Do list, Task assignment and Today's Challenge) has these tabs, moved there from PMS on request because they are daily tasks. "CCTV monitoring" is for Admin, HR, managers (read their own division) and the monitor (the person who has KPI-119 "CCTV Monitoring Coverage %" assigned). "Indexing and VM photos" is for people who have KPI-035 Indexing Completion or KPI-036 Display / VM Completion assigned, for their approvers and for Admin and HR.
- CCTV observation: category, date (today or the last 3 days), division or a person, Positive or Negative, remark (needed for Negative), photo or short video (up to 3 MB; kept in memory in the prototype). Categories: Division Discipline (KPI-189, all employees of the division), Body Language (KPI-187, all employees of the division), Manager Floor Presence (KPI-190, one person who has the KPI). Admin can add categories and pick their KPI.
- Scoring: the score starts at the KPI maximum; each Negative cuts 0.25 and each Positive adds 0.25 back, never above the maximum or below zero, in the order of the observations. The step is set by Admin. No observation in the month = full score.
- Monitor KPI-119: on every working day each active category needs an entry; score = maximum x average share of categories covered per working day.
- Indexing and VM photo: one photo per section per day (the employee writes the section name), no time limit, up to the last 3 days. It goes by workflow WF-028 (Reporting Manager, then HR Manager); only the last approval adds to the score. A rejected photo shows the reason and can be sent again. Score = maximum x days with an approved photo / working days.
- Method of KPI-189, 187, 190, 119, 035, 036 changed from Manager Scoring or Audit to Auto. For this sample the KPIs are assigned to: KPI-189 and 187 all Sales Executives, KPI-190 all Division Managers, KPI-119 Anjali Rao (E019), KPI-035 and 036 Sana Ali and Imran Sheikh. The client assigns them in KPI assignment.
- Not built: coverage per division (only per category), video proof for photos, real file storage (server time).


## Thirtieth List: KPI-033 Opening Attendance Verification (Batch 79)
- KPI-033 is now Auto. Time Office has a new tab "Attendance check" for every manager who has direct reportees (and for Admin and HR to see all managers). The Manager role now has view right on Time Office, but sees only this tab. A person with reportees who has the Employee role needs the Manager role to see it; the KPI is still assigned automatically.
- The KPI goes automatically to every employee who has at least one direct reportee (no manual assignment).
- Every working day the manager checks the in and out punches of the team for the day before (status, in, out, missed punch or short hours) and presses Verify. Deadline: 11:30 in the morning of the next working day of the manager; if the manager is on leave or weekly off, the days are verified together on the next working day, and the deadline of those days moves to that day.
- For a punch problem the manager can write a note or press "Ask to regularize" (the employee gets a notice). A day counts as handled if there is a regularization request, an HR correction or a note.
- Credit per day: full = verified in time and no punch left without action; half = verified late, or verified with a punch left without action; none = not verified after the deadline. Days not yet due are left out. Score = maximum x credit of the days / days to verify.
- Admin and HR see a table of all managers (days to verify, in time, late or open, not verified, score). The seeded sample has verifications for four managers.
- Only the running month is checked. If the manager himself is also assigned a store, the same screen applies.


## Thirty-first List: KPI-034 Refilling Completion % (Batch 80)
- KPI-034 is Auto. My Assignment has a new tab "Refilling" for the people who have the KPI (Admin, HR and managers see the entries of their people, read only).
- Daily Refilling form: date (today or the last 3 days) and one line for each product range with Quantity needed and Quantity refilled. A range filled again for the same date replaces the earlier one. Refilled cannot be more than needed.
- Product ranges are a list kept by Admin and HR in the same tab (name, Hindi name, optional division, active). Seeded: Sarees, Kurtis, Lehengas and gowns, Dress materials, Men's shirts, Men's trousers, Kids wear, Accessories.
- Score: completion of a day = refilled / needed (a form with nothing needed counts 100%); a working day with no form counts 0%; score = maximum x average completion of the working days. Today is left out until the form is filled.
- Reports (My Assignment module): "Refilling report (daily, range-wise)" and "Refilling summary (employee-wise)" with working days, days filled, quantities, average completion and KPI score; both export to Excel and filter by branch, department, designation or employee.
- For this sample the KPI is assigned to all Sales Executives (E004, E005, E012) and some days of the month are filled.
- Not built: a target quantity per range (so "needed" is typed by the person), photo proof of the refilling.

## Thirty-second List (4 Nov 2026)
- 7 KPIs moved to Manager Scoring: KPI-056, 085, 091, 123, 127, 154, 182.
- KPI-110 is Auto: average % of the scored marketing KPIs (108, 109, 111, 172 to 181) of everyone who has any of them assigned; not tied to reportees.
- KPI-037 renamed "Weekly Barcode/Tag Inspection", Auto, weekly. Assigned to Division Manager and Team Leader. New tab "Barcode/Tag inspection" in My Assignment. Weekly report per section (checked, missing, wrong, unreadable, double, put right, remarks, photo name). Score of a week = 60% report in the week + 20% sections covered + 20% problems put right. Reports: weekly section-wise and employee summary, with Excel.
- Open: real photo upload and storage (server time); who fixes the pending problems is only a remark for now.

## Thirty-third List (4 Nov 2026) - KPI-089 System Maintenance
- Assets has a new tab "Maintenance": service schedule by type (Desktop 3 months, Laptop 3, Printer 6, editable by Admin/HR; a system can have its own interval), status of every system (On schedule, Due in 7 days, Overdue), service reports of the month. Only Desktop, Laptop and Printer are in scope.
- KPI-089 is Auto and assigned to IT Executive. The holder sees "System maintenance" in My Assignment: list of systems to service and a service report form (many systems in one form, own tick list per system, condition, remarks, optional photo). Service before due date is allowed. Each service is written in the asset history.
- Score = systems serviced in the month / systems counted (due date passed or serviced). Company-wide, not per person.
- Reports (Assets): System service report, Systems due for service, both with Excel.
- Open: real photo storage; a repair-needed report does not change the asset status or raise a ticket yet.

## Thirty-fourth List (4 Nov 2026) - KPI-125 Daily Preventive Maintenance
- KPI-125 renamed "Daily Preventive Maintenance Completion %", Auto, daily. No schedule to maintain. New designation Electrician (assigned by designation); demo holder is employee 19.
- New tab "Electrical maintenance" in My Assignment. The electrician files a daily report with one block per store and area: store, floor/area, manager code (only managers of that store; the name appears after the code), 8 items (not checked / fine / fault put right / vendor needed), work done, parts, pending, photo proof (required).
- Each block goes to the manager chosen; approval in the tab and in the Inbox; reject needs a reason, the electrician corrects and sends again.
- Fault marked "vendor needed" opens a Support Hub ticket (Admin Support, Electrical) at once.
- If the manager does not act in 2 days the electrician gets a notification (once).
- Score = days with at least one approved report / working days. Number of faults never changes the score.
- Reports: electrical visits (store-wise, daily) and electrician-wise summary, both with Excel.
- Open: store managers are taken as Manager, Team Leader, Floor Manager, Division Manager or anyone with reportees in that store; photo kept only in the prototype session.

## Thirty-fifth List (4 Nov 2026) - checklist KPIs
- KPI-028 Cleaning Audit Score stays an Audit; the auditor is chosen by Admin/HR for each audit (no default auditor).
- KPI-031 Opening and KPI-032 Closing checklist are now Auto, daily forms. Tab "Opening / closing checklist" in My Assignment, shown ONLY to the person who has the KPI (Admin, HR and managers do not see the form; they use the reports). Questions come from the linked checklist (CHK-03, CHK-04); required questions must be answered; score of a day = weighted % of answers; a working day with no form counts 0; KPI score = max x average of the days.
- Reports (My Assignment, with Excel): Opening / closing checklist report (daily) and employee-wise summary.
- KPI-039 Floor Round deleted (and its checklist). KPI-129 Daily Maintenance Log merged into KPI-125 (rule text says so). KPI count is now 396.
- Excel LV-People-KPI-Library.xlsx regenerated with 396 KPIs.
- Open: nothing creates the monthly audit tasks automatically; HR assigns the auditor in PMS > Audit.

## Thirty-sixth List (5 Nov 2026) - Labour code check
- Built: 50% wage rule check (warning only; wages = components marked "counts in PF"), minimum wage master by state / zone / skill (warning only), Bonus Act limits (eligibility 21,000 and calculation ceiling 7,000 or minimum wage, editable; warning only), deductions limit 50% (warning), statutory registers (employees, wages, muster roll, overtime, deductions, leave), leave type option "full quota from day one" or "as per labour law: after 180 days, 1 per 20 days worked", gratuity, Cockpit import for leave balance.
- Plan agreed, not built: TDS (old/new regime choice, investment declaration and proofs, Form 16, Form 24Q data).
- Set aside by the user (not needed now): 4 fixed-term employees, 5 final settlement within 2 working days, 6 notice pay, 9 salary payment date alert, 11 overtime quarterly limit, 12 night shift consent for women.


## Thirty-seventh List (6 Nov 2026) - Attendance processing in 7 steps (Time Office > Attendance processing)
- Reference: HROne screens (attendance 3 steps, salary 11 steps). Salary page with 11 steps comes next, after the user guides it.
- Steps: 1 Check (mandatory), 2 This month's attendance (mandatory), 3 Comp-off and weekly off / holiday work, 4 Attendance correction arrear (earlier months), 5 Overtime, 6 Overtime arrear (earlier months), 7 Attendance allowance. Steps 3 to 7 are not mandatory.
- Every step shows counts, a View list (search and CSV) and turns into a tick when nothing is pending; the button comes back by itself if someone becomes pending (for example a late joiner in a locked month).
- Month list: any month up to the current one. The app looks at that month for a moment (withMonth) and comes back; no reload.
- Step 1 blocks processing when: an employee has no shift, or the earlier month is not processed (first month of the client can be marked). Pending requests only hold that employee.
- Comp-off: rule per weekly off and per holiday: comp-off, extra pay, both or none; lapse days (default 30); approved through the overtime workflow WF-016; comp-off added to leave type CO; leave is used from the oldest credit first.
- Overtime arrear: late overtime of earlier locked months (window set in the rule, default 1 month) is paid in the month being processed.
- Attendance allowance: rules (per day present, per night shift, attendance bonus) by scope (company, branch, division, department, designation, employee), with PF / ESIC / TDS switches; lines wait for a second approver in Additions & deductions.
- Fixed: a month with no saved state showed "Processed" in Payroll run; it is now a draft.


## Thirty-eighth List (6 Nov 2026) - Attendance holds days and hours; Payroll makes the amounts
- Rule from the user: Attendance processes only days and hours. Every amount is made in Payroll.
- Attendance now has 6 steps (allowance moved out): Check, This month's attendance, Comp-off and off-day work, Attendance correction (days), Overtime (hours), Overtime of earlier months (hours). No amount is stored or shown to approvers; overtime approval shows hours.
- Payroll > Monthly payroll has 13 steps: 1 Check, 2 Attendance correction amount, 3 Salary revision arrear, 4 Overtime of earlier months, 5 Overtime of this month, 6 Weekly off / holiday extra pay, 7 Attendance allowance, 8 Process salary, 9 Verify, 10 Release, 11 Publish, 12 Release reimbursement, 13 Publish reimbursement.
- Overtime and off-day amounts are made when the step is processed (hours x hourly rate x multiple; days x one day's pay), using the salary of the month the work was done.
- Arrear and allowance lines wait for the approver set in workflow WF-029 (default HR Manager); no separate "late joining arrear". A line not approved by the time salary is processed moves to the next month.
- Salary revision arrear: a revision that starts in an earlier paid month pays (what should have been paid minus what was paid).
- Verify: only the holders of the new role "Salary Verifier" (ROL-009) can verify; if nobody is set the Admin can. Release: HR, Admin or Accounts make the bank file and enter the UTR; a payment cannot go to a bank file, be recorded or be published before verify.
- Reimbursement: step 12 shows claims waiting for payment and opens the Accounts desk; step 13 only shows that employees were told (notification) when a claim was paid.
- Month with no saved state is a draft (this was the cause of "November Processed").


## Thirty-ninth List (6 Nov 2026) - Recruitment: offer letter PDF, revoke, bring back, resume file
- Offer letter PDF with the company letterhead (same PDF tool as other letters), signed by the HR who made the offer; from the candidate window and from the Offers list. English and Hindi text.
- Revoke offer: only while the candidate has not joined; reason is needed and kept; the candidate goes to Selected (a new offer can be made) or Rejected. Revoked offers are left out of the acceptance rate and of KPI-065.
- Bring back to the pipeline: a Rejected or Dropped candidate goes to Applied, Screening, Interview (if he had interviews) or Selected (if the last interview said Select); a reason is needed; the vacancy must be open; history keeps both moves.
- Resume can be uploaded as a file (up to 2 MB) besides the link; in the real app it is kept in the private Storage bucket.
- Not working in the real database yet (needs a public server function): the career portal (#careers) for people without a login, and an employee's referral (employees cannot write the recruitment store). The planned candidate joining link (candidate fills details and uploads documents on the joining day) needs the same server function.

## Fortieth List (6 Nov 2026) - Public server function "portal": joining link, career portal, referral
- Server: Supabase Edge Function `portal` (no login needed), tables `candidate_links` and `career_applications` (only HR of the client can read or write them; the public never touches the tables). Files go to the private Storage bucket `files`. Origins allowed (secret ALLOWED_ORIGINS must list them): lv-people.pages.dev, lv-people.netlify.app and localhost:5181 (add a custom domain in the function secret ALLOWED_ORIGINS).
- Checks on the server (the browser is never trusted): token fingerprint, expiry (joining date + 7 days), file size 2 MB, real file type read from the first bytes (PDF, JPG, PNG, WebP; resume also Word), PAN, Aadhaar, IFSC, mobile, age 18+, duplicate mobile, hidden robot field, 200 applications an hour per company, 20 tries per link, nothing is uploaded until everything else is right.
- Joining link (HR, candidate window, stage Selected or Offered): `#join=<token>`; only the fingerprint is stored, the link is shown once with Copy and WhatsApp; a new link cancels the old one. The candidate fills father, date of birth, gender, address, emergency contact, PAN, Aadhaar, UAN, bank, and uploads Aadhaar, PAN, bank proof, education, photo (relieving letter optional); he can send again until HR has received it.
- HR side: on opening the app, what candidates sent is merged into the candidate (details shown with PAN, Aadhaar and account masked; documents marked Received with a link to the file; the Mark joined form starts from it and the full numbers go into the employee record).
- Career portal: `#careers=<company code>` shows the company's open vacancies from the real data and saves applications (with a resume file or link) for HR. Employee referral now goes through the server too.
- Test files left in Storage (tiny): 8 from the portal tests, plus the earlier test image; delete them in Supabase > Storage > files if you like.

## Forty-first List (11 Nov 2026) - Inbox last dates and KPI-399
- Every Inbox item has a last date (Due column, with "due tomorrow", "due today", "overdue"). Own last date if the item has one; otherwise the day it came plus working days from SLA-053: approval or other work 2, acknowledgement 3, notice to read 2 (Sundays and holidays not counted).
- New store IBL (Inbox ledger): one line per person and item of the other modules (first seen, last date, done on). Approvals and notices are read from TASKS; a notice now keeps the date it was read. Employees can write only their own lines; first-seen date, last date and a done date cannot be changed afterwards (server rule in `server/inbox_tat.sql`).
- KPI-399 "Inbox Tasks Done Before Due %" (Auto, monthly, Common, module pms): on time ÷ items whose last date has come × 100. Counted for items due from 1 December 2026. Assigned by hand in PMS > KPI assignment (the user's rule: KPIs are never assigned automatically). In the pack of all three clients.
- Left out of the KPI: To Do items, Today's Challenge (own KPI) and the biometric machine alerts.
- Reports > PMS: Inbox TAT report (employee-wise), Inbox items (item-wise). Scheduler job: one reminder a day for items due tomorrow or overdue (the reminder itself is not counted).
- Known limit: an item of another module is written when the person opens the app, so "came on" and "done on" are the days the app was opened. Finished lines older than six months are removed.
- Fix: a client's saved SLA list no longer drops SLA values added by a newer version of the app (the demo client had lost followT, trafT, engRateT).
- Not done: the Excel KPI library file was not regenerated with KPI-399.

