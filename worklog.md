---
Task ID: 1
Agent: Main Agent
Task: Fix FREE tier enforcement - only Students, Teachers, Settings, Dashboard work after trial expires

Work Log:
- Read all 19 affected files to understand current state
- Updated auth.ts: BASIC features = only dashboard, students, teachers, settings; added isProOrTrial() and requireProAccess() helpers
- Updated page.tsx: wrapped 18 views with ProGuard (classes, class-form, class-detail, subjects, attendance, attendance-mark, grades, timetable, events, homework, behavior, exams, announcements, announcement-form, messages, message-compose, fees, fee-form, reports, staff)
- Updated sidebar.tsx: marked 13+ nav items as pro:true across ownerNav, managerNav, teacherNav
- Added PRO API checks to 13 API routes: classes (GET+POST), subjects (GET+POST), attendance (GET+POST), grades (GET+POST), timetable (GET+POST), announcements (GET+POST), events (GET+POST), homework (GET+POST), behavior (GET+POST), exams (GET+POST), fees (GET+POST), messages (GET+POST), reports (GET), payments (POST)
- Updated settings-view.tsx: correct upgrade/trial messaging
- Updated upgrade-page.tsx: 12 PRO features listed, correct trial expired message
- Build passed with zero errors
- Pushed to GitHub successfully

Stage Summary:
- FREE (BASIC) tier now correctly restricts to: Dashboard, Students, Teachers, Settings
- All other features require PRO plan OR active 30-day trial
- FINANCE and SUPER_ADMIN roles bypass PRO checks (as intended)
- Payment proof flow verified: user chooses plan → pays → submits proof → admin reviews → school upgraded
- Deployed to Vercel via GitHub push (auto-deploy)
