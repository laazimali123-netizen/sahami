// ═══════════════════════════════════════════════════════════
// SAHAMI - Database Seed Script
// Creates demo school with sample data for all modules
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Seeding SAHAMI database...\n');

  // ─── Create Demo School (PRO plan for full feature access) ───
  const school = await prisma.school.upsert({
    where: { id: 'school_demo_001' },
    update: {},
    create: {
      id: 'school_demo_001',
      name: 'Al-Noor International Academy',
      nameAr: 'أكاديمية النور الدولية',
      address: '123 Education Boulevard, Knowledge City',
      phone: '+1 (555) 123-4567',
      email: 'admin@alnoor-academy.edu',
      plan: 'PRO',
      maxStudents: 500,
      maxTeachers: 50,
      academicYear: '2025-2026',
    },
  });
  console.log(`✅ School created: ${school.name} (${school.plan} plan)`);

  // ─── Create Users ───
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sahami.com' },
    update: {},
    create: {
      id: 'super_admin_001',
      email: 'admin@sahami.com',
      password: await hashPassword('admin123'),
      name: 'SAHAMI Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email} / admin123`);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@alnoor.edu' },
    update: {},
    create: {
      id: 'manager_001',
      email: 'manager@alnoor.edu',
      password: await hashPassword('manager123'),
      name: 'Dr. Fatima Al-Hassan',
      phone: '+1 (555) 111-2222',
      role: 'MANAGER',
      schoolId: school.id,
    },
  });
  console.log(`✅ Manager: ${manager.email} / manager123`);

  const teachers = [];
  const teacherData = [
    { id: 'teacher_001', name: 'Mr. James Wilson', email: 'james.wilson@alnoor.edu', phone: '+1 (555) 201-3001', subject: 'Mathematics' },
    { id: 'teacher_002', name: 'Ms. Sarah Chen', email: 'sarah.chen@alnoor.edu', phone: '+1 (555) 201-3002', subject: 'Physics' },
    { id: 'teacher_003', name: 'Mr. Ahmed Al-Rashid', email: 'ahmed.rashid@alnoor.edu', phone: '+1 (555) 201-3003', subject: 'English' },
    { id: 'teacher_004', name: 'Ms. Maria Santos', email: 'maria.santos@alnoor.edu', phone: '+1 (555) 201-3004', subject: 'Chemistry' },
    { id: 'teacher_005', name: 'Mr. David Kim', email: 'david.kim@alnoor.edu', phone: '+1 (555) 201-3005', subject: 'Biology' },
    { id: 'teacher_006', name: 'Ms. Fatima Zahra', email: 'fatima.zahra@alnoor.edu', phone: '+1 (555) 201-3006', subject: 'History' },
    { id: 'teacher_007', name: 'Mr. Robert Taylor', email: 'robert.taylor@alnoor.edu', phone: '+1 (555) 201-3007', subject: 'Computer Science' },
    { id: 'teacher_008', name: 'Ms. Lisa Anderson', email: 'lisa.anderson@alnoor.edu', phone: '+1 (555) 201-3008', subject: 'Art' },
  ];

  for (const td of teacherData) {
    const teacher = await prisma.user.upsert({
      where: { email: td.email },
      update: {},
      create: {
        id: td.id,
        email: td.email,
        password: await hashPassword('teacher123'),
        name: td.name,
        phone: td.phone,
        role: 'TEACHER',
        schoolId: school.id,
      },
    });
    teachers.push(teacher);
  }
  console.log(`✅ Teachers created: ${teachers.length} (password: teacher123)`);

  // ─── Create Subjects ───
  const subjectData = [
    { id: 'subj_001', name: 'Mathematics', code: 'MATH101' },
    { id: 'subj_002', name: 'Physics', code: 'PHY101' },
    { id: 'subj_003', name: 'English Language', code: 'ENG101' },
    { id: 'subj_004', name: 'Chemistry', code: 'CHEM101' },
    { id: 'subj_005', name: 'Biology', code: 'BIO101' },
    { id: 'subj_006', name: 'History', code: 'HIST101' },
    { id: 'subj_007', name: 'Computer Science', code: 'CS101' },
    { id: 'subj_008', name: 'Art & Design', code: 'ART101' },
    { id: 'subj_009', name: 'Physical Education', code: 'PE101' },
    { id: 'subj_010', name: 'Arabic Language', code: 'ARB101' },
  ];

  const subjects = [];
  for (const sd of subjectData) {
    const subject = await prisma.subject.upsert({
      where: { id: sd.id },
      update: {},
      create: { ...sd, schoolId: school.id },
    });
    subjects.push(subject);
  }
  console.log(`✅ Subjects created: ${subjects.length}`);

  // ─── Create Classes ───
  const classData = [
    { id: 'class_001', name: 'Grade 9-A', gradeLevel: '9', section: 'A', room: 'Room 101' },
    { id: 'class_002', name: 'Grade 9-B', gradeLevel: '9', section: 'B', room: 'Room 102' },
    { id: 'class_003', name: 'Grade 10-A', gradeLevel: '10', section: 'A', room: 'Room 201' },
    { id: 'class_004', name: 'Grade 10-B', gradeLevel: '10', section: 'B', room: 'Room 202' },
    { id: 'class_005', name: 'Grade 11-A', gradeLevel: '11', section: 'A', room: 'Room 301' },
    { id: 'class_006', name: 'Grade 11-B', gradeLevel: '11', section: 'B', room: 'Room 302' },
    { id: 'class_007', name: 'Grade 12-A', gradeLevel: '12', section: 'A', room: 'Room 401' },
    { id: 'class_008', name: 'Grade 12-B', gradeLevel: '12', section: 'B', room: 'Room 402' },
  ];

  const classes = [];
  for (const cd of classData) {
    const cls = await prisma.schoolClass.upsert({
      where: { id: cd.id },
      update: {},
      create: {
        ...cd,
        capacity: 30,
        schoolId: school.id,
        classSubjects: {
          create: subjects.slice(0, 8).map((s) => ({ subjectId: s.id })),
        },
      },
    });
    classes.push(cls);
  }
  console.log(`✅ Classes created: ${classes.length}`);

  // ─── Assign teachers to classes ───
  const teacherAssignments = [
    { teacherId: 'teacher_001', classIds: ['class_001', 'class_003', 'class_005', 'class_007'] }, // Math
    { teacherId: 'teacher_002', classIds: ['class_002', 'class_004', 'class_006', 'class_008'] }, // Physics
    { teacherId: 'teacher_003', classIds: ['class_001', 'class_002', 'class_003', 'class_004'] }, // English
    { teacherId: 'teacher_004', classIds: ['class_005', 'class_006', 'class_007', 'class_008'] }, // Chemistry
    { teacherId: 'teacher_005', classIds: ['class_001', 'class_002', 'class_003', 'class_004'] }, // Biology
    { teacherId: 'teacher_006', classIds: ['class_005', 'class_006', 'class_007', 'class_008'] }, // History
    { teacherId: 'teacher_007', classIds: ['class_001', 'class_002', 'class_003', 'class_005'] }, // CS
    { teacherId: 'teacher_008', classIds: ['class_004', 'class_006', 'class_007', 'class_008'] }, // Art
  ];

  for (const ta of teacherAssignments) {
    for (const classId of ta.classIds) {
      await prisma.classTeacher.upsert({
        where: { classId_teacherId: { classId, teacherId: ta.teacherId } },
        update: {},
        create: { classId, teacherId: ta.teacherId, schoolId: school.id },
      });
    }
  }
  console.log(`✅ Teacher assignments created`);

  // ─── Create Students ───
  const firstNames = ['Omar', 'Layla', 'Yusuf', 'Noor', 'Ali', 'Maryam', 'Ibrahim', 'Sara', 'Khalid', 'Amina',
    'Zayed', 'Hana', 'Tariq', 'Zara', 'Hassan', 'Fatima', 'Adam', 'Rania', 'Rami', 'Dania',
    'Saeed', 'Lina', 'Faisal', 'Huda', 'Nasser', 'Mona', 'Bader', 'Rasha', 'Waleed', 'Heba'];

  const lastNames = ['Al-Hassan', 'Chen', 'Wilson', 'Santos', 'Kim', 'Al-Rashid', 'Taylor', 'Anderson',
    'Patel', 'Nakamura', 'Garcia', 'Brown', 'Zahra', 'Malik', 'Okafor', 'Ivanov'];

  const students = [];
  let studentNum = 1;
  for (const cls of classes) {
    const numStudents = 6 + Math.floor(Math.random() * 5); // 6-10 per class
    for (let i = 0; i < numStudents; i++) {
      const firstName = firstNames[studentNum % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = i % 3 === 0 ? 'FEMALE' : 'MALE';
      const sid = `STU-2025-${String(studentNum).padStart(4, '0')}`;

      const student = await prisma.student.upsert({
        where: { id: `student_${String(studentNum).padStart(4, '0')}` },
        update: {},
        create: {
          id: `student_${String(studentNum).padStart(4, '0')}`,
          studentId: sid,
          firstName,
          lastName,
          gender,
          dateOfBirth: `${2006 + Math.floor(Math.random() * 4)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
          phone: `+1 (555) ${String(400 + Math.floor(Math.random() * 600))}-${String(1000 + Math.floor(Math.random() * 9000))}`,
          guardianName: `${gender === 'MALE' ? 'Mr.' : 'Mrs.'} ${lastName}`,
          guardianPhone: `+1 (555) ${String(700 + Math.floor(Math.random() * 300))}-${String(1000 + Math.floor(Math.random() * 9000))}`,
          guardianRelation: 'Father',
          schoolId: school.id,
          enrollDate: '2025-09-01',
          status: 'ACTIVE',
          enrollments: {
            create: { classId: cls.id },
          },
        },
      });
      students.push(student);
      studentNum++;
    }
  }
  console.log(`✅ Students created: ${students.length}`);

  // ─── Create Attendance Records (last 7 days) ───
  const today = new Date();
  let attendanceCount = 0;
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const cls of classes) {
      const enrolledStudents = await prisma.student.findMany({
        where: {
          enrollments: { some: { classId: cls.id, status: 'ACTIVE' } },
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      for (const student of enrolledStudents) {
        const rand = Math.random();
        let status = 'PRESENT';
        if (rand > 0.92) status = 'ABSENT';
        else if (rand > 0.85) status = 'LATE';
        else if (rand > 0.82) status = 'EXCUSED';

        await prisma.attendanceRecord.upsert({
          where: {
            studentId_classId_date: { studentId: student.id, classId: cls.id, date: dateStr },
          },
          update: {},
          create: {
            studentId: student.id,
            classId: cls.id,
            date: dateStr,
            status,
            markedBy: 'teacher_001',
          },
        });
        attendanceCount++;
      }
    }
  }
  console.log(`✅ Attendance records created: ${attendanceCount}`);

  // ─── Create Grades ───
  let gradeCount = 0;
  const terms = ['Term 1'];
  const types = ['EXAM', 'QUIZ', 'ASSIGNMENT', 'PROJECT'];
  const titles = ['Midterm Exam', 'Chapter Quiz 1', 'Homework 1', 'Class Project', 'Final Exam', 'Pop Quiz'];

  for (const cls of classes) {
    const enrolledStudents = await prisma.student.findMany({
      where: { enrollments: { some: { classId: cls.id } } },
      select: { id: true },
    });

    for (const student of enrolledStudents) {
      // 3-5 grades per student per subject
      for (const subject of subjects.slice(0, 6)) {
        const numGrades = 3 + Math.floor(Math.random() * 3);
        for (let g = 0; g < numGrades; g++) {
          const score = 55 + Math.floor(Math.random() * 45); // 55-99
          const maxScore = types[g % types.length] === 'QUIZ' ? 20 : 100;

          await prisma.grade.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              classId: cls.id,
              teacherId: teachers[g % teachers.length].id,
              term: terms[0],
              type: types[g % types.length],
              title: titles[g % titles.length],
              score,
              maxScore,
              date: `2025-${String(9 + Math.floor(g / 2)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
            },
          });
          gradeCount++;
        }
      }
    }
  }
  console.log(`✅ Grades created: ${gradeCount}`);

  // ─── Create Announcements ───
  const announcements = [
    { title: 'Welcome Back to School!', content: 'We are excited to welcome all students and staff to the new academic year 2025-2026. Let\'s make it a great one!', priority: 'HIGH' },
    { title: 'Parent-Teacher Meeting', content: 'The first parent-teacher meeting of the semester is scheduled for October 15, 2025 at 3:00 PM in the main auditorium.', priority: 'NORMAL' },
    { title: 'Science Fair Registration Open', content: 'Students interested in participating in the annual Science Fair should register with their science teacher by November 1st.', priority: 'NORMAL' },
    { title: 'Holiday Schedule Update', content: 'Please note the updated holiday schedule for the winter break. School will be closed from December 20 to January 5.', priority: 'HIGH' },
    { title: 'New Library Hours', content: 'The school library will now be open until 5:00 PM on weekdays for additional study time.', priority: 'LOW' },
    { title: 'Sports Day Preparation', content: 'All students should prepare for the annual Sports Day event. Practice sessions begin next week.', priority: 'NORMAL' },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({
      data: {
        ...a,
        schoolId: school.id,
        authorId: manager.id,
      },
    });
  }
  console.log(`✅ Announcements created: ${announcements.length}`);

  // ─── Create Timetable Slots ───
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const timeSlots = [
    { start: '08:00', end: '08:45' },
    { start: '08:50', end: '09:35' },
    { start: '09:40', end: '10:25' },
    { start: '10:40', end: '11:25' },
    { start: '11:30', end: '12:15' },
    { start: '13:00', end: '13:45' },
    { start: '13:50', end: '14:35' },
  ];

  let slotCount = 0;
  for (const cls of classes) {
    for (const day of days) {
      const classTeachers = await prisma.classTeacher.findMany({
        where: { classId: cls.id },
        include: { teacher: true },
      });

      const classSubjects = await prisma.classSubject.findMany({
        where: { classId: cls.id },
        include: { subject: true },
      });

      for (let i = 0; i < timeSlots.length; i++) {
        const subjIdx = i % classSubjects.length;
        const teacherIdx = i % classTeachers.length;
        if (classSubjects[subjIdx] && classTeachers[teacherIdx]) {
          await prisma.timetableSlot.create({
            data: {
              classId: cls.id,
              subjectId: classSubjects[subjIdx].subjectId,
              teacherId: classTeachers[teacherIdx].teacherId,
              dayOfWeek: day,
              startTime: timeSlots[i].start,
              endTime: timeSlots[i].end,
              schoolId: school.id,
            },
          });
          slotCount++;
        }
      }
    }
  }
  console.log(`✅ Timetable slots created: ${slotCount}`);

  // ─── Create Fee Records (PRO feature) ───
  let feeCount = 0;
  for (const student of students) {
    const fees = [
      { title: 'Tuition Fee - Term 1', amount: 2500, dueDate: '2025-09-30' },
      { title: 'Tuition Fee - Term 2', amount: 2500, dueDate: '2026-01-15' },
      { title: 'Lab Fee', amount: 300, dueDate: '2025-09-15' },
      { title: 'Library Fee', amount: 100, dueDate: '2025-09-15' },
    ];

    for (const f of fees) {
      const isPaid = Math.random() > 0.4;
      await prisma.feeRecord.create({
        data: {
          studentId: student.id,
          title: f.title,
          amount: f.amount,
          dueDate: f.dueDate,
          status: isPaid ? 'PAID' : (Math.random() > 0.5 ? 'PENDING' : 'OVERDUE'),
          schoolId: school.id,
          ...(isPaid ? {
            payments: {
              create: {
                amount: f.amount,
                method: ['CASH', 'BANK_TRANSFER', 'ONLINE'][Math.floor(Math.random() * 3)],
                receivedBy: manager.id,
                paidAt: '2025-09-10',
              },
            },
          } : {}),
        },
      });
      feeCount++;
    }
  }
  console.log(`✅ Fee records created: ${feeCount}`);

  // ─── Create Messages ───
  const messages = [
    { from: 'teacher_001', to: 'manager_001', subject: 'Math supplies needed', content: 'We need to order new geometry sets for Grade 10 and 11 students. The current ones are worn out.' },
    { from: 'teacher_003', to: 'teacher_001', subject: 'Cross-curriculum project', content: 'Would you be interested in a joint English-Math project? I was thinking about data analysis of literary works.' },
    { from: 'manager_001', to: 'teacher_005', subject: 'Biology lab equipment', content: 'Please submit the list of required lab equipment for the upcoming semester by Friday.' },
    { from: 'teacher_007', to: 'manager_001', subject: 'Computer lab maintenance', content: 'Some computers in Lab 2 need maintenance. Can we schedule a technician visit this week?' },
    { from: 'teacher_002', to: 'teacher_004', subject: 'Science department meeting', content: 'Reminder: Science department meeting is on Thursday at 2 PM. Please prepare your curriculum updates.' },
  ];

  for (const m of messages) {
    await prisma.message.create({
      data: {
        senderId: m.from,
        receiverId: m.to,
        subject: m.subject,
        content: m.content,
        ...(m.to !== 'manager_001' ? { isRead: true } : {}),
      },
    });
  }
  console.log(`✅ Messages created: ${messages.length}`);

  console.log('\n🎉 SAHAMI database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Super Admin:  admin@sahami.com / admin123');
  console.log('   Manager:      manager@alnoor.edu / manager123');
  console.log('   Teacher:      james.wilson@alnoor.edu / teacher123');
  console.log('   (Any teacher email / teacher123)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
