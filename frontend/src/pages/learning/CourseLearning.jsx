import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, ExternalLink, PlayCircle } from "lucide-react";
import Navbar from "../../Components/common/Navbar";
import { courseService } from "../../api/course.service";
import { courseContentService } from "../../api/courseContent.service";

function CourseLearning() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadContent = useCallback(async () => {
    const [courseResult, modulesResult, progressResult] = await Promise.all([
      courseService.getCourseById(courseId),
      courseContentService.getModules(courseId),
      courseContentService.getProgress(courseId),
    ]);
    if (!courseResult.success) setError(courseResult.error);
    else setCourse(courseResult.data);
    if (!modulesResult.success) setError(modulesResult.error);
    else setModules(modulesResult.data);
    if (progressResult.success) setProgress(progressResult.data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const lessons = useMemo(() => modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))), [modules]);
  const selectedIndex = lessons.findIndex((lesson) => lesson.id === selectedId);
  const selectedLesson = lessons[selectedIndex] || lessons.find((lesson) => !lesson.completed) || lessons[0];

  useEffect(() => {
    if (!selectedId && lessons.length) {
      setSelectedId((lessons.find((lesson) => !lesson.completed) || lessons[0]).id);
    } else if (selectedId && !lessons.some((lesson) => lesson.id === selectedId)) {
      setSelectedId(lessons.length ? lessons[0].id : null);
    }
  }, [lessons, selectedId]);

  const markCompleted = async () => {
    if (!selectedLesson) return;
    const result = await courseContentService.completeLesson(selectedLesson.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError("");
    await loadContent();
    const nextLesson = lessons[selectedIndex + 1];
    if (nextLesson) setSelectedId(nextLesson.id);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50"><Navbar /><p className="p-10 text-center" role="status">Loading your course…</p></div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-slate-50"><Navbar /><p className="p-10 text-center text-red-700" role="alert">{error || "Course not found."}</p></div>;
  }

  const externalOnly = lessons.length === 0 && course.externalUrl;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/learnings" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
          <ArrowLeft size={16} aria-hidden="true" /> My courses
        </Link>
        <header className="mb-6 mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">{course.topic || "Course"}</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{course.course_name}</h1>
            <p className="mt-2 text-slate-600">Instructor: {course.instructor || "Course team"}{course.duration ? ` · ${course.duration}` : ""}</p>
          </div>
          {progress && progress.totalLessons > 0 && (
            <div className="min-w-52 rounded-xl bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{Math.round(progress.progressPercent)}% complete</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress.progressPercent}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{progress.completedLessons} of {progress.totalLessons} lessons</p>
            </div>
          )}
        </header>

        {course.externalUrl && (
          <p className="mb-5 text-sm text-slate-600">
            This course also has external materials:{" "}
            <a href={course.externalUrl} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:underline">
              open course provider
            </a>
          </p>
        )}

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}

        {externalOnly ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <ExternalLink className="mx-auto text-indigo-700" size={40} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Continue with the course provider</h2>
            <p className="mt-2 text-slate-600">This course is hosted by an external learning provider.</p>
            <a href={course.externalUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">
              Open external course
            </a>
          </section>
        ) : lessons.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            {course.y_link ? (
              <ReactPlayer url={course.y_link} controls width="100%" height="min(65vh, 620px)" />
            ) : <p className="text-slate-600">No lessons have been added to this course yet.</p>}
            <p className="mt-5 whitespace-pre-wrap text-slate-700">{course.description}</p>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm">
              {selectedLesson?.videoUrl ? (
                <div className="aspect-video bg-black">
                  <ReactPlayer url={selectedLesson.videoUrl} controls width="100%" height="100%" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 px-6 text-center text-white">
                  <div><PlayCircle size={48} className="mx-auto text-indigo-300" /><p className="mt-3 text-xl font-semibold">{selectedLesson?.title}</p></div>
                </div>
              )}
              {selectedLesson && (
                <div className="p-6">
                  <p className="text-sm font-semibold text-indigo-700">{selectedLesson.moduleTitle}</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedLesson.title}</h2>
                  {selectedLesson.durationMinutes > 0 && <p className="mt-1 text-sm text-slate-500">{selectedLesson.durationMinutes} min</p>}
                  {selectedLesson.content && <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{selectedLesson.content}</p>}
                  {selectedLesson.resources?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-slate-900">Learning materials</h3>
                      <ul className="mt-2 space-y-2">
                        {selectedLesson.resources.map((resource) => (
                          <li key={resource.id}>
                            <a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:underline">
                              <Download size={15} aria-hidden="true" /> {resource.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                    <button type="button" disabled={selectedIndex <= 0} onClick={() => setSelectedId(lessons[selectedIndex - 1]?.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40">
                      <ArrowLeft size={16} /> Previous
                    </button>
                    <button type="button" onClick={markCompleted} disabled={selectedLesson.completed} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800 disabled:bg-green-700">
                      <CheckCircle2 size={16} /> {selectedLesson.completed ? "Completed" : "Mark complete"}
                    </button>
                    <button type="button" disabled={selectedIndex >= lessons.length - 1} onClick={() => setSelectedId(lessons[selectedIndex + 1]?.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40">
                      Next <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="px-2 py-2 text-lg font-bold text-slate-900">Course syllabus</h2>
              <div className="mt-2 space-y-4">
                {modules.map((module) => (
                  <section key={module.id}>
                    <h3 className="px-2 text-sm font-semibold text-slate-500">{module.title}</h3>
                    <ul className="mt-1 space-y-1">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <button type="button" onClick={() => setSelectedId(lesson.id)} className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-indigo-50 ${selectedLesson?.id === lesson.id ? "bg-indigo-50 text-indigo-800" : "text-slate-700"}`}>
                            <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${lesson.completed ? "text-green-600" : "text-slate-300"}`} aria-hidden="true" />
                            <span>{lesson.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              {progress?.progressPercent === 100 && (
                <Link to={`/certificate/${courseId}`} className="mt-5 block rounded-lg bg-green-700 px-4 py-2.5 text-center font-semibold text-white hover:bg-green-800">Get completion certificate</Link>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CourseLearning;
