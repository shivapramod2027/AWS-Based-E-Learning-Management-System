import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, GraduationCap, Users, RefreshCw } from "lucide-react";
import { adminService } from "../../api/admin.service";

const numberFormat = new Intl.NumberFormat();

function Dashboard({ onNavigate }) {
  const [data, setData] = useState({
    users: null,
    courses: null,
    enrollments: null,
    totalEnrollments: null,
    progress: null,
    courseProgress: null,
    activeLearners: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const [usersResult, coursesResult, enrollmentsResult, summaryResult, progressResult, courseProgressResult, activeLearnersResult] = await Promise.all([
      adminService.getAllUsers(),
      adminService.getAllCourses(),
      adminService.getAllLearning(),
      adminService.getCourseEnrollmentSummary(),
      adminService.getProgressMetrics(),
      adminService.getCourseProgressSummaries(),
      adminService.getActiveLearnerCount(),
    ]);
    const failures = [usersResult, coursesResult, enrollmentsResult, summaryResult, progressResult, courseProgressResult, activeLearnersResult]
      .filter((result) => !result.success);

    setData({
      users: usersResult.success ? usersResult.data : null,
      courses: coursesResult.success ? coursesResult.data : null,
      enrollments: summaryResult.success ? summaryResult.data : null,
      totalEnrollments: enrollmentsResult.success ? enrollmentsResult.data.length : null,
      progress: progressResult.success ? progressResult.data : null,
      courseProgress: courseProgressResult.success ? courseProgressResult.data : null,
      activeLearners: activeLearnersResult.success ? activeLearnersResult.data : null,
    });
    setError(failures.length ? "Some dashboard information could not be loaded. Try refreshing." : "");
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const students = useMemo(
    () => (data.users || []).filter((user) => user.role === "USER"),
    [data.users]
  );
  const latestCourses = useMemo(
    () => [...(data.courses || [])]
      .filter((course) => course.createdAt)
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      .slice(0, 5),
    [data.courses]
  );
  const enrollmentChart = useMemo(
    () => [...(data.enrollments || [])].sort((first, second) => second.enrollments - first.enrollments).slice(0, 6),
    [data.enrollments]
  );
  const maxEnrollments = Math.max(...enrollmentChart.map((course) => course.enrollments), 1);
  const courseProgressChart = (data.courseProgress || []).slice(0, 6);

  const cards = [
    { label: "Registered students", value: data.users ? students.length : null, icon: Users, color: "text-blue-700 bg-blue-50" },
    { label: "Active learners", value: data.activeLearners, icon: GraduationCap, color: "text-emerald-700 bg-emerald-50" },
    { label: "Total courses", value: data.courses?.length ?? null, icon: BookOpen, color: "text-violet-700 bg-violet-50" },
    { label: "Enrollments", value: data.totalEnrollments, icon: GraduationCap, color: "text-teal-700 bg-teal-50" },
    { label: "Completed courses", value: data.progress?.completedCourses ?? null, icon: CheckCircle2, color: "text-amber-700 bg-amber-50" },
    { label: "Average course progress", value: data.progress ? `${Math.round(data.progress.averageCompletionPercent)}%` : null, icon: CheckCircle2, color: "text-cyan-700 bg-cyan-50" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">LearnSphere administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Platform overview</h1>
          <p className="mt-2 text-slate-600">Live metrics and recent course activity from your LMS.</p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          Refresh data
        </button>
      </header>

      {error && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">{error}</p>}

      <section aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900" aria-live="polite">
                  {loading ? "…" : value === null ? "—" : typeof value === "number" ? numberFormat.format(value) : value}
                </p>
              </div>
              <span className={`rounded-xl p-3 ${color}`}><Icon size={22} aria-hidden="true" /></span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Enrollments by course</h2>
            <p className="mt-1 text-sm text-slate-500">Most enrolled courses, based on saved student records.</p>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500" role="status">Loading enrollment data…</p>
          ) : enrollmentChart.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-slate-600">No enrollments recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {enrollmentChart.map((course) => (
                <li key={course.courseId}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-slate-700" title={course.courseName}>{course.courseName}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">{numberFormat.format(course.enrollments)}</span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="img"
                    aria-label={`${course.courseName}: ${course.enrollments} enrollments`}
                  >
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${Math.max((course.enrollments / maxEnrollments) * 100, 3)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Recently added courses</h2>
            <p className="mt-1 text-sm text-slate-500">Latest course records in the database.</p>
          </div>
          {loading ? (
            <p className="py-8 text-center text-slate-500" role="status">Loading courses…</p>
          ) : latestCourses.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-8 text-center">
              <p className="text-slate-600">No course dates available yet.</p>
              <button type="button" onClick={() => onNavigate?.("courses")} className="mt-3 font-semibold text-indigo-700 hover:text-indigo-800">
                Add your first course
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latestCourses.map((course) => (
                <li key={course.course_id} className="flex items-center gap-3 py-3">
                  {course.p_link ? (
                    <img src={course.p_link} alt="" className="h-11 w-14 rounded-lg bg-slate-100 object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-11 w-14 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><BookOpen size={18} /></span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{course.course_name}</p>
                    <p className="text-xs text-slate-500">{new Date(course.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Learning progress by course</h2>
          <p className="mt-1 text-sm text-slate-500">Average learner completion and number of tracked enrollments.</p>
        </div>
        {loading ? (
          <p className="py-6 text-center text-slate-500" role="status">Loading course progress…</p>
        ) : courseProgressChart.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-slate-600">Progress will appear once students start learning.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {courseProgressChart.map((course) => (
              <li key={course.courseId} className="rounded-lg bg-slate-50 p-4">
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-slate-800" title={course.courseName}>{course.courseName}</span>
                  <span className="shrink-0 text-slate-600">{course.learners} learners · {course.completedLearners} complete</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`${course.courseName}: ${Math.round(course.averageProgressPercent)}% average completion`}>
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(Math.max(course.averageProgressPercent, 0), 100)}%` }} />
                </div>
                <p className="mt-1 text-right text-xs font-medium text-slate-600">{Math.round(course.averageProgressPercent)}% average progress</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Manage the platform from one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "courses", label: "Manage courses" },
            { key: "user", label: "Manage users" },
            { key: "enrollments", label: "View enrollments" },
          ].map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onNavigate?.(action.key)}
              className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
