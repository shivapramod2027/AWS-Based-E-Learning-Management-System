import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { courseContentService } from "../../api/courseContent.service";
import { adminService } from "../../api/admin.service";

function CourseContentAdmin({ courseId, onBack }) {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessonDrafts, setLessonDrafts] = useState({});
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleEditDraft, setModuleEditDraft] = useState({});
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonEditDraft, setLessonEditDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadContent = useCallback(async () => {
    const [courseResult, moduleResult] = await Promise.all([
      adminService.getCourseById(courseId),
      courseContentService.getModules(courseId),
    ]);
    if (courseResult.success) setCourse(courseResult.data);
    if (moduleResult.success) setModules(moduleResult.data);
    if (!courseResult.success || !moduleResult.success) {
      setError(courseResult.error || moduleResult.error || "Unable to load course content.");
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { loadContent(); }, [loadContent]);

  const addModule = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const result = await courseContentService.createModule(courseId, {
      title: moduleTitle,
      description: moduleDescription,
      moduleOrder: modules.length,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setModuleTitle("");
    setModuleDescription("");
    setNotice("Module added.");
    await loadContent();
  };

  const beginModuleEdit = (module) => {
    setEditingModuleId(module.id);
    setModuleEditDraft({ title: module.title, description: module.description || "" });
  };

  const saveModule = async (event, module) => {
    event.preventDefault();
    const result = await courseContentService.updateModule(module.id, {
      ...moduleEditDraft,
      moduleOrder: module.moduleOrder,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditingModuleId(null);
    setNotice("Module updated.");
    await loadContent();
  };

  const beginLessonEdit = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonEditDraft({
      title: lesson.title,
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      durationMinutes: lesson.durationMinutes || "",
      resourceTitle: lesson.resources?.[0]?.title || "",
      resourceUrl: lesson.resources?.[0]?.url || "",
    });
  };

  const saveLesson = async (event, lesson) => {
    event.preventDefault();
    const otherResources = (lesson.resources || []).slice(1);
    const resources = lessonEditDraft.resourceUrl?.trim()
      ? [{ title: lessonEditDraft.resourceTitle?.trim() || "Course material", url: lessonEditDraft.resourceUrl.trim() }, ...otherResources]
      : otherResources;
    const result = await courseContentService.updateLesson(lesson.id, {
      title: lessonEditDraft.title,
      content: lessonEditDraft.content,
      videoUrl: lessonEditDraft.videoUrl || null,
      lessonOrder: lesson.lessonOrder,
      durationMinutes: lessonEditDraft.durationMinutes ? Number(lessonEditDraft.durationMinutes) : null,
      resources,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditingLessonId(null);
    setNotice("Lesson updated.");
    await loadContent();
  };

  const updateLessonDraft = (moduleId, field, value) => {
    setLessonDrafts((drafts) => ({
      ...drafts,
      [moduleId]: { ...drafts[moduleId], [field]: value },
    }));
  };

  const addLesson = async (event, module) => {
    event.preventDefault();
    const draft = lessonDrafts[module.id] || {};
    setError("");
    setNotice("");
    const resources = draft.resourceUrl?.trim()
      ? [{ title: draft.resourceTitle?.trim() || "Course material", url: draft.resourceUrl.trim() }]
      : [];
    const result = await courseContentService.createLesson(module.id, {
      title: draft.title,
      content: draft.content,
      videoUrl: draft.videoUrl || null,
      lessonOrder: module.lessons.length,
      durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : null,
      resources,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLessonDrafts((drafts) => ({ ...drafts, [module.id]: {} }));
    setNotice("Lesson added. Enrolled students have been notified.");
    await loadContent();
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and all of its lessons and completion records?")) return;
    const result = await courseContentService.deleteModule(moduleId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice("Module deleted.");
    await loadContent();
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson and its completion records?")) return;
    const result = await courseContentService.deleteLesson(lessonId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice("Lesson deleted.");
    await loadContent();
  };

  if (loading) return <p role="status">Loading course syllabus…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
        <ArrowLeft size={16} /> Back to courses
      </button>
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Course content</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{course?.course_name || "Manage syllabus"}</h1>
        <p className="mt-2 text-slate-600">Organize the course into modules, video lessons, text, and resource links.</p>
      </header>
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-green-50 p-3 text-green-800" role="status">{notice}</p>}

      <form onSubmit={addModule} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_2fr_auto]">
        <label className="text-sm font-medium text-slate-700">Module title
          <input required maxLength="255" value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" placeholder="e.g. Getting started" />
        </label>
        <label className="text-sm font-medium text-slate-700">Description
          <input maxLength="2000" value={moduleDescription} onChange={(event) => setModuleDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" placeholder="What students will learn" />
        </label>
        <button type="submit" className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800"><Plus size={16} /> Add module</button>
      </form>

      {modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BookOpen className="mx-auto text-slate-400" size={36} />
          <p className="mt-3 font-semibold text-slate-800">No modules yet</p>
          <p className="mt-1 text-sm text-slate-500">Add a module, then add lessons and resources to it.</p>
        </div>
      ) : modules.map((module) => {
        const draft = lessonDrafts[module.id] || {};
        return (
          <section key={module.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3">
              {editingModuleId === module.id ? (
                <form onSubmit={(event) => saveModule(event, module)} className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input required maxLength="255" value={moduleEditDraft.title || ""} onChange={(event) => setModuleEditDraft((draft) => ({ ...draft, title: event.target.value }))} className="rounded-lg border border-slate-300 p-2" aria-label="Module title" />
                  <input maxLength="2000" value={moduleEditDraft.description || ""} onChange={(event) => setModuleEditDraft((draft) => ({ ...draft, description: event.target.value }))} className="rounded-lg border border-slate-300 p-2" aria-label="Module description" />
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white"><Save size={15} /> Save</button>
                    <button type="button" onClick={() => setEditingModuleId(null)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><X size={15} /> Cancel</button>
                  </div>
                </form>
              ) : (
                <div><h2 className="text-xl font-bold text-slate-900">{module.moduleOrder + 1}. {module.title}</h2><p className="mt-1 text-sm text-slate-600">{module.description}</p></div>
              )}
              <div className="flex gap-1">
                {editingModuleId !== module.id && <button type="button" onClick={() => beginModuleEdit(module)} aria-label={`Edit ${module.title}`} className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-50"><Pencil size={17} /></button>}
                <button type="button" onClick={() => deleteModule(module.id)} aria-label={`Delete ${module.title}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 size={18} /></button>
              </div>
            </header>
            <ul className="divide-y divide-slate-100">
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="py-3">
                  {editingLessonId === lesson.id ? (
                    <form onSubmit={(event) => saveLesson(event, lesson)} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
                      <input required maxLength="255" value={lessonEditDraft.title || ""} onChange={(event) => setLessonEditDraft((draft) => ({ ...draft, title: event.target.value }))} className="rounded-lg border border-slate-300 p-2.5" placeholder="Lesson title" />
                      <input type="url" value={lessonEditDraft.videoUrl || ""} onChange={(event) => setLessonEditDraft((draft) => ({ ...draft, videoUrl: event.target.value }))} className="rounded-lg border border-slate-300 p-2.5" placeholder="Video URL (optional)" />
                      <textarea rows="3" maxLength="8000" value={lessonEditDraft.content || ""} onChange={(event) => setLessonEditDraft((draft) => ({ ...draft, content: event.target.value }))} className="rounded-lg border border-slate-300 p-2.5 md:col-span-2" placeholder="Lesson content" />
                      <input type="number" min="0" value={lessonEditDraft.durationMinutes || ""} onChange={(event) => setLessonEditDraft((draft) => ({ ...draft, durationMinutes: event.target.value }))} className="rounded-lg border border-slate-300 p-2.5" placeholder="Duration in minutes" />
                      <input value={lessonEditDraft.resourceTitle || ""} onChange={(event) => setLessonEditDraft((draft) => ({ ...draft, resourceTitle: event.target.value }))} className="rounded-lg border border-slate-300 p-2.5" placeholder="Primary resource title" />
                      <input type="url" value={lessonEditDraft.resourceUrl || ""} onChange={(event) => setLessonEditDraft((draft) => ({ ...draft, resourceUrl: event.target.value }))} className="rounded-lg border border-slate-300 p-2.5 md:col-span-2" placeholder="Primary resource URL" />
                      <div className="flex gap-2 md:col-span-2">
                        <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white"><Save size={15} /> Save lesson</button>
                        <button type="button" onClick={() => setEditingLessonId(null)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><X size={15} /> Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="font-semibold text-slate-800">{lesson.lessonOrder + 1}. {lesson.title}</p><p className="text-xs text-slate-500">{lesson.videoUrl ? "Video lesson" : "Text lesson"} · {lesson.resources.length} resources</p></div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => beginLessonEdit(lesson)} aria-label={`Edit ${lesson.title}`} className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-50"><Pencil size={16} /></button>
                        <button type="button" onClick={() => deleteLesson(lesson.id)} aria-label={`Delete ${lesson.title}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <form onSubmit={(event) => addLesson(event, module)} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
              <h3 className="font-semibold text-slate-900 md:col-span-2">Add lesson</h3>
              <input required maxLength="255" value={draft.title || ""} onChange={(event) => updateLessonDraft(module.id, "title", event.target.value)} className="rounded-lg border border-slate-300 p-2.5" placeholder="Lesson title" />
              <input type="url" value={draft.videoUrl || ""} onChange={(event) => updateLessonDraft(module.id, "videoUrl", event.target.value)} className="rounded-lg border border-slate-300 p-2.5" placeholder="Video URL (optional)" />
              <textarea rows="3" maxLength="8000" value={draft.content || ""} onChange={(event) => updateLessonDraft(module.id, "content", event.target.value)} className="rounded-lg border border-slate-300 p-2.5 md:col-span-2" placeholder="Lesson text or instructions (optional)" />
              <input type="number" min="0" value={draft.durationMinutes || ""} onChange={(event) => updateLessonDraft(module.id, "durationMinutes", event.target.value)} className="rounded-lg border border-slate-300 p-2.5" placeholder="Duration in minutes (optional)" />
              <input type="text" value={draft.resourceTitle || ""} onChange={(event) => updateLessonDraft(module.id, "resourceTitle", event.target.value)} className="rounded-lg border border-slate-300 p-2.5" placeholder="Resource title (optional)" />
              <input type="url" value={draft.resourceUrl || ""} onChange={(event) => updateLessonDraft(module.id, "resourceUrl", event.target.value)} className="rounded-lg border border-slate-300 p-2.5 md:col-span-2" placeholder="Download or reference URL (optional)" />
              <button type="submit" className="rounded-lg border border-indigo-300 bg-white px-4 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50 md:col-span-2">Add lesson</button>
            </form>
          </section>
        );
      })}
    </div>
  );
}

export default CourseContentAdmin;
