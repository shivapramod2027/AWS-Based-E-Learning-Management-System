import { useEffect, useState } from "react";
import { assignmentService } from "../../api/assignment.service";
import { adminService } from "../../api/admin.service";

function AssignmentsAdmin() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({});
  const [form, setForm] = useState({ courseId: "", title: "", description: "", dueAt: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    const [courseResult, assignmentResult] = await Promise.all([
      adminService.getAllCourses(),
      assignmentService.getAllAssignments(),
    ]);
    if (courseResult.success) {
      setCourses(courseResult.data);
      setForm((current) => ({ ...current, courseId: current.courseId || courseResult.data[0]?.course_id || "" }));
    }
    if (assignmentResult.success) setAssignments(assignmentResult.data);
    if (!courseResult.success || !assignmentResult.success) {
      setError(courseResult.error || assignmentResult.error || "Unable to load assignment data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectAssignment = async (id) => {
    setSelectedId(id);
    setNotice("");
    const result = await assignmentService.getSubmissions(id);
    if (result.success) setSubmissions(result.data);
    else setError(result.error);
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const result = await assignmentService.create(form);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice("Assignment published. Enrolled students have been notified.");
    setForm((current) => ({ ...current, title: "", description: "", dueAt: "" }));
    await loadData();
  };

  const saveGrade = async (submission) => {
    const draft = grades[submission.id] || {};
    const gradeValue = draft.grade === undefined ? submission.grade : draft.grade;
    if (gradeValue === null || gradeValue === undefined || String(gradeValue).trim() === "") {
      setError("Enter a grade from 0 to 100 before saving.");
      return;
    }
    const result = await assignmentService.grade(submission.id, {
      grade: Number(gradeValue),
      feedback: draft.feedback === undefined ? submission.feedback : draft.feedback,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(`Saved grade for ${submission.studentName}.`);
    await selectAssignment(selectedId);
  };

  const deleteAssignment = async (id) => {
    const result = await assignmentService.delete(id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (selectedId === id) {
      setSelectedId("");
      setSubmissions([]);
    }
    await loadData();
  };

  if (loading) return <p role="status">Loading assignment tools…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Coursework</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Assignments</h1>
        <p className="mt-2 text-slate-600">Publish coursework, review submissions, and provide grades and feedback.</p>
      </header>
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-green-50 p-3 text-green-800" role="status">{notice}</p>}

      <form onSubmit={createAssignment} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <h2 className="text-lg font-bold text-slate-900 md:col-span-2">Publish an assignment</h2>
        <label className="text-sm font-medium text-slate-700">
          Course
          <select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3">
            <option value="" disabled>Select a course</option>
            {courses.map((course) => <option key={course.course_id} value={course.course_id}>{course.course_name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Due date and time
          <input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Title
          <input required maxLength="255" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Instructions
          <textarea required rows="4" maxLength="4000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
        </label>
        <button type="submit" disabled={!courses.length} className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 md:col-span-2">
          Publish assignment
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Published assignments</h2>
        {assignments.length === 0 ? <p className="text-slate-600">No assignments have been published.</p> : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{assignment.title}</p>
                  <p className="text-sm text-slate-500">{assignment.courseName} · Due {new Date(assignment.dueAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => selectAssignment(assignment.id)} className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Review submissions</button>
                  <button type="button" onClick={() => deleteAssignment(assignment.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedId && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Student submissions</h2>
          {submissions.length === 0 ? <p className="text-slate-600">No submissions yet.</p> : (
            <ul className="space-y-5">
              {submissions.map((submission) => {
                const draft = grades[submission.id] || {};
                return (
                  <li key={submission.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div><p className="font-semibold text-slate-900">{submission.studentName}</p><p className="text-sm text-slate-500">{submission.studentEmail}</p></div>
                      <p className="text-sm text-slate-500">Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                    </div>
                    {submission.content && <p className="my-3 whitespace-pre-wrap text-slate-700">{submission.content}</p>}
                    {submission.submissionUrl && <a className="text-sm font-semibold text-indigo-700 underline" href={submission.submissionUrl} target="_blank" rel="noreferrer">Open submitted work</a>}
                    <div className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
                      <label className="text-sm font-medium text-slate-700">Grade / 100
                        <input type="number" min="0" max="100" step="0.5" value={draft.grade ?? submission.grade ?? ""} onChange={(event) => setGrades({ ...grades, [submission.id]: { ...draft, grade: event.target.value } })} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
                      </label>
                      <label className="text-sm font-medium text-slate-700">Feedback
                        <input value={draft.feedback ?? submission.feedback ?? ""} onChange={(event) => setGrades({ ...grades, [submission.id]: { ...draft, feedback: event.target.value } })} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
                      </label>
                      <button type="button" onClick={() => saveGrade(submission)} className="self-end rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800">Save grade</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default AssignmentsAdmin;
