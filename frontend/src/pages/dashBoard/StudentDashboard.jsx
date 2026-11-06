import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import { learningService } from "../../api/learning.service";
import { authService } from "../../api/auth.service";
import { progressService } from "../../api/progress.service";
import { courseService } from "../../api/course.service";
import { notificationService } from "../../api/notification.service";

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = authService.getCurrentUser();

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      const [courseResult, progressResult, catalogResult, notificationResult] = await Promise.all([
        learningService.getEnrollments(user.id),
        progressService.getMyProgress(),
        courseService.getAllCourses(),
        notificationService.getAll(),
      ]);
      if (!active) return;
      if (courseResult.success) setCourses(courseResult.data);
      if (progressResult.success) setProgressRows(progressResult.data);
      if (notificationResult.success) setNotifications(notificationResult.data);
      const errors = [courseResult, progressResult, catalogResult, notificationResult]
        .filter((result) => !result.success);
      if (errors.length) setError("Some dashboard information could not be loaded. Please refresh the page.");
      if (courseResult.success && catalogResult.success) {
        const enrolledIds = new Set(courseResult.data.map((course) => course.course_id));
        setRecommendations(catalogResult.data.filter((course) => !enrolledIds.has(course.course_id)).slice(0, 3));
      }
      setLoading(false);
    }
    loadDashboard();
    return () => { active = false; };
  }, [user.id]);

  const progressByCourse = useMemo(
    () => new Map(progressRows.map((row) => [row.courseId, row])),
    [progressRows]
  );
  const completedCount = progressRows.filter((item) => item.completed).length;
  const unreadNotifications = notifications.filter((item) => !item.read);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-800 p-7 text-white shadow-lg sm:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200">Your learning space</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back{user.name ? `, ${user.name}` : ""}</h1>
            <p className="mt-2 max-w-xl text-indigo-100">Pick up where you left off, check your progress, or discover your next course.</p>
          </div>
          <Link to="/courses" className="rounded-lg bg-white px-5 py-3 font-semibold text-indigo-900 transition hover:bg-indigo-50">Explore courses</Link>
        </header>

        {error && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900" role="alert">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Learning summary">
          {[
            { label: "Enrolled courses", value: courses.length, icon: BookOpen },
            { label: "In progress", value: Math.max(courses.length - completedCount, 0), icon: GraduationCap },
            { label: "Completed courses", value: completedCount, icon: CheckCircle2 },
            { label: "Unread notifications", value: unreadNotifications.length, icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-900">{loading ? "…" : value}</p></div>
                <span className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon size={22} aria-hidden="true" /></span>
              </div>
            </article>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><h2 className="text-xl font-bold text-slate-900">Continue learning</h2><p className="mt-1 text-sm text-slate-500">Your enrolled courses and current progress.</p></div>
              <Link to="/learnings" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">View all</Link>
            </div>
            {loading ? <p className="py-8 text-center text-slate-500" role="status">Loading your learning…</p> : courses.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <p className="text-slate-700">You have not enrolled in a course yet.</p>
                <Link to="/courses" className="mt-3 inline-block font-semibold text-indigo-700">Explore the course catalog</Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {courses.slice(0, 5).map((course) => {
                  const progress = progressByCourse.get(course.course_id);
                  const percent = Math.round(progress?.progressPercent || 0);
                  return (
                    <li key={course.course_id} className="flex flex-wrap items-center gap-4 py-4">
                      {course.p_link ? <img src={course.p_link} alt="" className="h-16 w-24 rounded-lg bg-slate-100 object-cover" /> : <span className="flex h-16 w-24 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><BookOpen /></span>}
                      <div className="min-w-40 flex-1">
                        <h3 className="font-semibold text-slate-900">{course.course_name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{course.instructor ? `Instructor: ${course.instructor}` : "Self-paced course"}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} /></div>
                          <span className="text-xs font-semibold text-slate-600">{percent}%</span>
                        </div>
                      </div>
                      <Link to={`/learn/${course.course_id}`} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">{progress?.completed ? "Review" : "Continue"}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-xl font-bold text-slate-900">Recent notifications</h2><p className="mt-1 text-sm text-slate-500">Course news and learning reminders.</p></div>
              <Link to="/notifications" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">See all</Link>
            </div>
            {loading ? <p className="py-6 text-slate-500" role="status">Loading updates…</p> : notifications.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">No notifications yet. Course updates will appear here.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.slice(0, 5).map((item) => (
                  <li key={item.id} className="py-3">
                    <p className={`text-sm font-semibold ${item.read ? "text-slate-700" : "text-indigo-800"}`}>{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/notifications" className="mt-4 inline-block text-sm font-semibold text-indigo-700">Manage reminder settings</Link>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-xl font-bold text-slate-900">Recommended for you</h2><p className="mt-1 text-sm text-slate-500">Discover courses from your catalog.</p></div>
            <Link to="/courses" className="text-sm font-semibold text-indigo-700">Browse all</Link>
          </div>
          {loading ? <p role="status" className="text-slate-500">Loading recommendations…</p> : recommendations.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">No recommendations are available right now.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((course) => (
                <li key={course.course_id} className="overflow-hidden rounded-xl border border-slate-200">
                  {course.p_link && <img src={course.p_link} alt="" className="h-36 w-full object-cover" loading="lazy" />}
                  <div className="p-4"><h3 className="font-semibold text-slate-900">{course.course_name}</h3><p className="mt-1 text-sm text-slate-500">{course.topic || course.instructor}</p><Link to={`/course/${course.course_id}`} className="mt-3 inline-block text-sm font-semibold text-indigo-700">View course</Link></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
