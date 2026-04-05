// ═══════════════════════════════════════════════════════════
// SAHAMI - Dashboard Stats
// GET /api/dashboard
// Returns role-appropriate statistics
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  const { session } = auth;

  // Super admin gets platform-wide stats
  if (session.role === 'SUPER_ADMIN') {
    const [totalSchools, totalStudents, totalTeachers, totalUsers] = await Promise.all([
      db.school.count(),
      db.student.count(),
      db.user.count({ where: { role: 'TEACHER' } }),
      db.user.count(),
    ]);

    return new Response(JSON.stringify({
      totalSchools,
      totalStudents,
      totalTeachers,
      totalUsers,
      schools: await db.school.findMany({
        select: {
          id: true, name: true, plan: true, isActive: true,
          _count: { select: { students: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const schoolId = session.schoolId;

  // ═══════════════════════════════════════════════════════════
  // FINANCE Dashboard — financial data only
  // ═══════════════════════════════════════════════════════════
  if (session.role === 'FINANCE') {
    const [totalStudents, paidFees, pendingFees, overdueFees] = await Promise.all([
      db.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      db.feeRecord.aggregate({
        where: { schoolId, status: 'PAID' },
        _sum: { amount: true },
      }),
      db.feeRecord.aggregate({
        where: { schoolId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      db.feeRecord.aggregate({
        where: { schoolId, status: 'OVERDUE' },
        _sum: { amount: true },
      }),
    ]);

    return new Response(JSON.stringify({
      totalStudents,
      totalCollected: paidFees._sum.amount || 0,
      pendingFees: pendingFees._sum.amount || 0,
      overdueFees: overdueFees._sum.amount || 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TEACHER Dashboard — their classes and students only
  // ═══════════════════════════════════════════════════════════
  if (session.role === 'TEACHER') {
    // Get classes assigned to this teacher
    const classAssignments = await db.classTeacher.findMany({
      where: { teacherId: session.userId, schoolId },
      include: {
        class: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    const classList = classAssignments.map(ca => ({
      id: ca.class.id,
      name: ca.class.name,
      gradeLevel: ca.class.gradeLevel,
      section: ca.class.section,
      _count: ca.class._count,
    }));

    const classIds = classList.map(c => c.id);

    // Count total students across all assigned classes
    const myStudents = classIds.length > 0
      ? await db.enrollment.count({
          where: { classId: { in: classIds }, status: 'ACTIVE' },
        })
      : 0;

    // Today's attendance for their classes
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = classIds.length > 0
      ? await db.attendanceRecord.findMany({
          where: { classId: { in: classIds }, date: today },
        })
      : [];

    const presentToday = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalToday = todayAttendance.length;
    const todayRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

    // Average grades entered by this teacher
    const gradeStats = await db.grade.aggregate({
      where: { teacherId: session.userId },
      _avg: { score: true },
    });

    return new Response(JSON.stringify({
      myClasses: classList.length,
      myStudents,
      todayAttendance: totalToday > 0 ? `${todayRate}%` : '—',
      myAverageGrade: gradeStats._avg.score ? Math.round(gradeStats._avg.score * 10) / 10 : '—',
      classList,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // OWNER / MANAGER Dashboard — full school overview
  // ═══════════════════════════════════════════════════════════
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    todayAttendance,
    gradeStats,
    pendingFees,
    unreadMessages,
    recentEnrollments,
  ] = await Promise.all([
    db.student.count({ where: { schoolId, status: 'ACTIVE' } }),
    db.user.count({ where: { schoolId, role: { in: ['TEACHER', 'MANAGER', 'FINANCE'] }, isActive: true } }),
    db.schoolClass.count({ where: { schoolId } }),
    db.subject.count({ where: { schoolId } }),
    db.attendanceRecord.findMany({
      where: { schoolId, date: new Date().toISOString().split('T')[0] },
    }),
    db.grade.aggregate({
      where: { schoolId },
      _avg: { score: true },
    }),
    session.schoolPlan === 'PRO'
      ? db.feeRecord.aggregate({
          where: { schoolId, status: { in: ['PENDING', 'OVERDUE'] } },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    db.message.count({
      where: { receiverId: session.userId, isRead: false },
    }),
    db.student.findMany({
      where: { schoolId },
      include: {
        enrollments: {
          include: { class: { select: { name: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Calculate attendance rate
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const totalMarked = todayAttendance.length;
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  // Grade distribution
  const allGrades = await db.grade.findMany({
    where: { schoolId },
    select: { score: true },
  });
  const gradeDistribution = [
    { range: '90-100', count: allGrades.filter((g) => g.score >= 90).length },
    { range: '80-89', count: allGrades.filter((g) => g.score >= 80 && g.score < 90).length },
    { range: '70-79', count: allGrades.filter((g) => g.score >= 70 && g.score < 80).length },
    { range: '60-69', count: allGrades.filter((g) => g.score >= 60 && g.score < 70).length },
    { range: 'Below 60', count: allGrades.filter((g) => g.score < 60).length },
  ];

  // Attendance trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const attendanceTrend = await Promise.all(
    last7Days.map(async (date) => {
      const records = await db.attendanceRecord.findMany({
        where: { schoolId, date },
      });
      return {
        date,
        present: records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
      };
    })
  );

  return new Response(JSON.stringify({
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    attendanceRate,
    averageGrade: Math.round((gradeStats._avg.score || 0) * 10) / 10,
    pendingFees: pendingFees._sum.amount || 0,
    unreadMessages,
    recentEnrollments,
    attendanceTrend,
    gradeDistribution,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
