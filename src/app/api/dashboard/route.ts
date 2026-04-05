// ═══════════════════════════════════════════════════════════
// SAHAMI - Dashboard Stats
// GET /api/dashboard
// Returns comprehensive statistics for the school dashboard
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

  // Managers and teachers get school-specific stats
  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const schoolId = session.schoolId;

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
    // Total active students
    db.student.count({ where: { schoolId, status: 'ACTIVE' } }),
    // Total active teachers
    db.user.count({ where: { schoolId, role: 'TEACHER', isActive: true } }),
    // Total classes
    db.schoolClass.count({ where: { schoolId } }),
    // Total subjects
    db.subject.count({ where: { schoolId } }),
    // Today's attendance
    db.attendanceRecord.findMany({
      where: { schoolId: schoolId, date: new Date().toISOString().split('T')[0] },
    }),
    // Average grades
    db.grade.aggregate({
      where: { schoolId },
      _avg: { score: true },
    }),
    // Pending fees (PRO)
    session.schoolPlan === 'PRO'
      ? db.feeRecord.aggregate({
          where: { schoolId, status: { in: ['PENDING', 'OVERDUE'] } },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    // Unread messages
    db.message.count({
      where: { receiverId: session.userId, isRead: false },
    }),
    // Recent enrollments
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

  // Calculate attendance rate from today's data
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const totalMarked = todayAttendance.length;
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  // Build grade distribution
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

  // Build attendance trend (last 7 days)
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
