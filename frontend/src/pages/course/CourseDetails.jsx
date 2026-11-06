import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import { courseService } from "../../api/course.service";
import { learningService } from "../../api/learning.service";
import { authService } from "../../api/auth.service";
import { courseContentService } from "../../api/courseContent.service";
import { paymentService } from "../../api/payment.service";
import { load } from "@cashfreepayments/cashfree-js";

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [error, setError] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const courseResult = await courseService.getCourseById(id);
      const modulesResult = await courseContentService.getModules(id);
      if (!active) return;
      if (!courseResult.success) {
        setError(courseResult.error);
        setLoading(false);
        return;
      }
      setCourse(courseResult.data);
      if (modulesResult.success) setModules(modulesResult.data);
      if (authService.isUserAuthenticated()) {
        const current = authService.getCurrentUser();
        const enrollmentResult = await learningService.getEnrollments(current.id);
        if (active && enrollmentResult.success) {
          setEnrolled(enrollmentResult.data.some((item) => item.course_id === id));
        }
      }
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [id]);

  const enroll = async () => {
    if (!authService.isUserAuthenticated()) {
      navigate("/login", { state: { from: `/course/${id}` } });
      return;
    }
    const user = authService.getCurrentUser();
    if (Number(course?.price) > 0) {
      setStartingCheckout(true);
      try {
        const checkout = await paymentService.createCheckoutSession(id, customerPhone);
        if (!checkout.success) {
          setError(checkout.error);
          return;
        }
        if (checkout.data.mode === "demo") {
          const checkoutUrl = new URL(checkout.data.checkoutUrl, window.location.origin);
          if (checkoutUrl.origin !== window.location.origin) {
            throw new Error("Demo checkout URL must stay on this site.");
          }
          navigate(`${checkoutUrl.pathname}${checkoutUrl.search}${checkoutUrl.hash}`, {
            state: { checkout: checkout.data },
          });
          return;
        }
        const cashfree = await load({ mode: checkout.data.mode });
        if (!cashfree) {
          setError("Could not load Cashfree checkout. Please try again.");
          return;
        }
        await cashfree.checkout({
          paymentSessionId: checkout.data.paymentSessionId,
          redirectTarget: "_self",
        });
      } catch (checkoutError) {
        console.error("Could not open Cashfree checkout:", checkoutError);
        setError("Could not open checkout. Please try again.");
      } finally {
        setStartingCheckout(false);
      }
      return;
    }
    setEnrolling(true);
    const result = await learningService.enrollCourse(user.id, id);
    setEnrolling(false);
    if (result.success || result.data === "Course already enrolled") {
      setEnrolled(true);
      navigate(`/learn/${id}`);
    } else {
      setError(result.error || "Unable to enroll in this course.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page="courses" />
      {loading ? <p className="p-12 text-center" role="status">Loading course details…</p> : error && !course ? (
        <p className="p-12 text-center text-red-700" role="alert">{error}</p>
      ) : course && (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Link to="/courses" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Browse courses</Link>
          {searchParams.get("payment") === "cancelled" && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">Checkout was cancelled. You have not been charged.</p>
          )}
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
            <section>
              <div className="overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
                {course.p_link ? <img src={course.p_link} alt="" className="h-72 w-full object-cover sm:h-96" /> : <div className="flex h-72 items-center justify-center bg-indigo-100 text-indigo-800 sm:h-96">Course image</div>}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {course.topic && <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">{course.topic}</span>}
                {course.difficulty && <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">{course.difficulty}</span>}
                {course.duration && <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">{course.duration}</span>}
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">{course.course_name}</h1>
              <p className="mt-3 text-lg leading-7 text-slate-600">{course.description}</p>
              <p className="mt-4 font-medium text-slate-700">Instructor: {course.instructor || "Course team"}</p>
              {course.rating !== null && course.rating !== undefined && (
                <p className="mt-2 text-sm font-semibold text-amber-700">★ {Number(course.rating).toFixed(1)} course rating</p>
              )}
              {course.learningObjectives && (
                <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">What you’ll learn</h2>
                  <p className="mt-3 whitespace-pre-wrap text-slate-700">{course.learningObjectives}</p>
                </section>
              )}
              <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Course syllabus</h2>
                {modules.length ? (
                  <ol className="mt-4 space-y-4">
                    {modules.map((module) => (
                      <li key={module.id} className="rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900">{module.moduleOrder + 1}. {module.title}</h3>
                        {module.description && <p className="mt-1 text-sm text-slate-600">{module.description}</p>}
                        <ul className="mt-2 space-y-1">
                          {module.lessons.map((lesson) => <li key={lesson.id} className="text-sm text-slate-700">• {lesson.title}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ""}</li>)}
                        </ul>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-2 text-sm text-slate-600">Course syllabus is being prepared.</p>}
                {course.externalUrl && <a href={course.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-indigo-700 underline">Course provider details</a>}
              </section>
            </section>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <p className="text-sm font-semibold text-slate-500">Course access</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{Number(course.price) > 0 ? `₹${course.price}` : "Free"}</p>
              {Number(course.price) > 0 && !enrolled && (
                <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="checkout-phone">
                  Mobile number (only needed for Cashfree; leave blank for demo)
                  <input
                    id="checkout-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(event) => {
                      setCustomerPhone(event.target.value);
                      setError("");
                    }}
                    placeholder="10-digit mobile number"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              )}
              <button type="button" onClick={enrolled ? () => navigate(`/learn/${id}`) : enroll} disabled={enrolling || startingCheckout} className="mt-5 w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">
                {enrolling ? "Enrolling…" : startingCheckout ? "Starting checkout…" : enrolled ? "Continue learning" : Number(course.price) > 0 ? `Continue to payment · ₹${course.price}` : "Enroll in course"}
              </button>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                <li>✓ Access enrolled lessons and course resources</li>
                <li>✓ Track your learning progress</li>
                <li>✓ Resume from your course syllabus</li>
              </ul>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

export default CourseDetails;
