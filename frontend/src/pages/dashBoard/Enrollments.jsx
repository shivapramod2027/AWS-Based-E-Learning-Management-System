import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { adminService } from "../../api/admin.service";

const PAGE_SIZE = 12;

function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    adminService.getAllLearning().then((result) => {
      if (!isMounted) return;
      if (result.success) setEnrollments(result.data);
      else {
        const loadError = result.error || "Could not load enrollments.";
        setError(loadError);
        message.error(loadError);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...enrollments]
      .filter((item) => !term
        || item.studentName?.toLowerCase().includes(term)
        || item.studentEmail?.toLowerCase().includes(term)
        || item.courseName?.toLowerCase().includes(term))
      .sort((first, second) => new Date(second.enrolledAt || 0) - new Date(first.enrolledAt || 0));
  }, [enrollments, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [query]);

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">LearnSphere administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Course enrollments</h1>
        <p className="mt-2 text-slate-600">Review student registrations against courses in the database.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="font-bold text-slate-900">Enrollment records</h2>
            <p className="mt-1 text-sm text-slate-500">{loading ? "Loading…" : `${filtered.length} records`}</p>
          </div>
          <label>
            <span className="sr-only">Search students and courses</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student or course"
              className="w-72 max-w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Student</th>
                <th scope="col" className="px-5 py-3 font-semibold">Course</th>
                <th scope="col" className="px-5 py-3 font-semibold">Enrollment ID</th>
                <th scope="col" className="px-5 py-3 font-semibold">Enrolled on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-500" role="status">Loading enrollment records…</td></tr>}
              {!loading && !error && visible.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{item.studentName || "Student"}</p>
                    <p className="text-slate-500">{item.studentEmail}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">{item.courseName}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                  <td className="px-5 py-4 text-slate-600">{item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {!loading && error && <tr><td colSpan="4" className="px-5 py-12 text-center text-red-700" role="alert">{error}</td></tr>}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-600">No matching enrollments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <span className="text-sm text-slate-500">Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">Previous</button>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Enrollments;
