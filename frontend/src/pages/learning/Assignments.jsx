import { useEffect, useState } from "react";
import Navbar from "../../Components/common/Navbar";
import { assignmentService } from "../../api/assignment.service";

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignments = async () => {
    const result = await assignmentService.getStudentAssignments();
    if (result.success) setAssignments(result.data);
    else setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const updateDraft = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const submitAssignment = async (assignment) => {
    const result = await assignmentService.submit(assignment.id, drafts[assignment.id] || {});
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError("");
    setDrafts((current) => ({ ...current, [assignment.id]: { content: "", submissionUrl: "" } }));
    await loadAssignments();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Coursework</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="mt-2 text-slate-600">Submit your work before the deadline and check instructor feedback here.</p>
        </header>
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
        {loading ? <p role="status">Loading assignments…</p> : assignments.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-600">No assignments for your enrolled courses yet.</p>
        ) : assignments.map((assignment) => {
          const draft = drafts[assignment.id] || {};
          const overdue = new Date(assignment.dueAt) <= new Date();
          return (
            <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-indigo-700">{assignment.courseName}</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{assignment.title}</h2>
                </div>
                <p className={`text-sm font-semibold ${overdue ? "text-red-700" : "text-slate-600"}`}>
                  Due {new Date(assignment.dueAt).toLocaleString()}
                </p>
              </div>
              <p className="my-4 whitespace-pre-wrap text-slate-700">{assignment.description}</p>
              {assignment.submissionId && (
                <div className="mb-4 rounded-lg bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-slate-800">
                    Submitted {new Date(assignment.submittedAt).toLocaleString()}
                    {assignment.grade !== null && assignment.grade !== undefined ? ` · Grade: ${assignment.grade}/100` : " · Awaiting grade"}
                  </p>
                  {assignment.feedback && <p className="mt-2 text-slate-600">Feedback: {assignment.feedback}</p>}
                </div>
              )}
              {overdue ? (
                <p className="text-sm text-slate-500">The deadline has passed; submissions are closed.</p>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Written response
                    <textarea
                      rows="4"
                      value={draft.content ?? assignment.submissionContent ?? ""}
                      onChange={(event) => updateDraft(assignment.id, "content", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Optional link to your work
                    <input
                      type="url"
                      value={draft.submissionUrl ?? assignment.submissionUrl ?? ""}
                      onChange={(event) => updateDraft(assignment.id, "submissionUrl", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                      placeholder="https://..."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => submitAssignment(assignment)}
                    className="rounded-lg bg-indigo-700 px-5 py-2.5 font-semibold text-white hover:bg-indigo-800"
                  >
                    {assignment.submissionId ? "Update submission" : "Submit assignment"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}

export default Assignments;
