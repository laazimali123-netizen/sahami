import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/reports/student/[id] — individual student report card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const { id } = await params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Student ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const student = await db.student.findUnique({
      where: { id },
      include: {
        enrollments: { include: { class: { select: { id: true, name: true, gradeLevel: true, section: true } } } },
      },
    });

    if (!student || (session.schoolId && student.schoolId !== session.schoolId && session.role !== 'SUPER_ADMIN')) {
      return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Get all grades by subject
    const grades = await db.grade.findMany({
      where: { studentId: id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group grades by subject
    const subjectGrades: Record<string, { subject: any; grades: any[]; average: number }> = {};
    grades.forEach(g => {
      const subKey = g.subjectId;
      if (!subjectGrades[subKey]) {
        subjectGrades[subKey] = { subject: g.subject, grades: [], average: 0 };
      }
      subjectGrades[subKey].grades.push(g);
    });

    // Calculate averages per subject
    Object.keys(subjectGrades).forEach(key => {
      const sg = subjectGrades[key];
      if (sg.grades.length > 0) {
        const total = sg.grades.reduce((sum: number, g: any) => sum + (g.score / g.maxScore) * 100, 0);
        sg.average = Math.round((total / sg.grades.length) * 10) / 10;
      }
    });

    const subjectsArray = Object.values(subjectGrades).sort((a, b) => b.average - a.average);

    // Overall average
    const overallAverage = subjectsArray.length > 0
      ? Math.round((subjectsArray.reduce((sum, s) => sum + s.average, 0) / subjectsArray.length) * 10) / 10
      : 0;

    // Attendance summary
    const attendance = await db.attendanceRecord.findMany({
      where: { studentId: id },
    });

    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
    const lateCount = attendance.filter(a => a.status === 'LATE').length;
    const excusedCount = attendance.filter(a => a.status === 'EXCUSED').length;
    const totalAttendance = attendance.length || 1;
    const attendanceRate = Math.round((presentCount / totalAttendance) * 100);

    // Class rank (based on overall average among classmates)
    let classRank = 0;
    let totalInClass = 0;
    if (student.enrollments.length > 0) {
      const classId = student.enrollments[0].classId;
      totalInClass = await db.enrollment.count({ where: { classId } });

      // Get all students in class with their grade averages
      const classStudents = await db.enrollment.findMany({
        where: { classId },
        select: { studentId: true },
      });

      const studentAverages = await Promise.all(
        classStudents.map(async (cs) => {
          const studentGrades = await db.grade.findMany({
            where: { studentId: cs.studentId },
            select: { score: true, maxScore: true },
          });
          if (studentGrades.length === 0) return { studentId: cs.studentId, avg: 0 };
          const avg = studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / studentGrades.length;
          return { studentId: cs.studentId, avg };
        })
      );

      studentAverages.sort((a, b) => b.avg - a.avg);
      classRank = studentAverages.findIndex(s => s.studentId === id) + 1;
    }

    return new Response(JSON.stringify({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        enrollments: student.enrollments,
      },
      subjects: subjectsArray,
      overallAverage,
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        total: attendance.length,
        rate: attendanceRate,
      },
      classRank: totalInClass > 0 ? `${classRank} / ${totalInClass}` : 'N/A',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Student report error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
