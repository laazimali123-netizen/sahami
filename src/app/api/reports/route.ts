import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/reports — school-wide analytics
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const schoolId = session.schoolId;

    // Attendance summary
    const attendanceRecords = await db.attendanceRecord.findMany({
      where: {
        student: { schoolId },
      },
    });

    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendanceRecords.filter(a => a.status === 'ABSENT').length;
    const lateCount = attendanceRecords.filter(a => a.status === 'LATE').length;
    const excusedCount = attendanceRecords.filter(a => a.status === 'EXCUSED').length;
    const totalAttendance = attendanceRecords.length || 1;
    const attendanceRate = Math.round((presentCount / totalAttendance) * 100);

    // Grade distribution
    const allGrades = await db.grade.findMany({
      where: {
        student: { schoolId },
      },
      select: { score: true, maxScore: true },
    });

    let aCount = 0, bCount = 0, cCount = 0, dCount = 0, fCount = 0;
    allGrades.forEach(g => {
      const pct = (g.score / g.maxScore) * 100;
      if (pct >= 90) aCount++;
      else if (pct >= 80) bCount++;
      else if (pct >= 70) cCount++;
      else if (pct >= 60) dCount++;
      else fCount++;
    });

    const gradeDistribution = [
      { range: 'A (90-100)', count: aCount, color: '#10b981' },
      { range: 'B (80-89)', count: bCount, color: '#14b8a6' },
      { range: 'C (70-79)', count: cCount, color: '#f59e0b' },
      { range: 'D (60-69)', count: dCount, color: '#f97316' },
      { range: 'F (<60)', count: fCount, color: '#ef4444' },
    ];

    // Fee collection stats (PRO or trial)
    const feeStats = { totalExpected: 0, totalCollected: 0, pending: 0, overdue: 0 };
    const isTrialActive = session.trialStart
      ? (Date.now() - new Date(session.trialStart).getTime()) / (1000 * 60 * 60 * 24) <= 30
      : false;
    if (session.schoolPlan === 'PRO' || isTrialActive) {
      const feeRecords = await db.feeRecord.findMany({
        where: { schoolId },
      });
      feeStats.totalExpected = feeRecords.reduce((sum, f) => sum + f.amount, 0);
      feeStats.totalCollected = feeRecords.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
      feeStats.pending = feeRecords.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.amount, 0);
      feeStats.overdue = feeRecords.filter(f => f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0);
    }

    // Enrollment summary
    const totalStudents = await db.student.count({ where: { schoolId } });
    const activeStudents = await db.student.count({ where: { schoolId, status: 'ACTIVE' } });

    // Top performing students
    const studentGrades = await db.grade.groupBy({
      by: ['studentId'],
      where: {
        student: { schoolId },
      },
      _avg: { score: true },
      orderBy: { _avg: { score: 'desc' } },
      take: 10,
    });

    const topStudents = await Promise.all(
      studentGrades.map(async (sg) => {
        const student = await db.student.findUnique({
          where: { id: sg.studentId },
          select: { id: true, studentId: true, firstName: true, lastName: true, enrollments: { include: { class: { select: { name: true } } } } },
        });
        return {
          ...student,
          averageScore: Math.round((sg._avg.score || 0) * 10) / 10,
        };
      })
    );

    return new Response(JSON.stringify({
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        total: attendanceRecords.length,
        rate: attendanceRate,
      },
      gradeDistribution,
      feeStats,
      enrollment: {
        total: totalStudents,
        active: activeStudents,
      },
      topStudents,
      totalGrades: allGrades.length,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Reports error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
