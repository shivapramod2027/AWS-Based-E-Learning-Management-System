import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import Footer from "../../Components/common/Footer";
import { faGraduationCap, faAward, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import bannerImg from "../../assets/images/home-banner.png";
import { courseService } from "../../api/course.service";

function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  useEffect(() => {
    let isMounted = true;
    courseService.getAllCourses().then((result) => {
      if (!isMounted) return;
      if (result.success) setCourses(result.data.slice(0, 6));
      else setCoursesError(result.error || "Unable to load courses right now.");
      setCoursesLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const featureData = [
    {
      icon: faGraduationCap,
      title: "Flexible learning",
      desc: "Learn at your own pace and revisit your enrolled courses.",
      color: "primary"
    },
    {
      icon: faStar,
      title: "Practical courses",
      desc: "Explore a growing catalog of instructor-led learning resources.",
      color: "warning"
    },
    {
      icon: faAward,
      title: "Track your progress",
      desc: "Keep your learning organized and monitor course progress.",
      color: "accent"
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar page="home" />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-white px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10 text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <FontAwesomeIcon icon={faGraduationCap} aria-hidden="true" />
              A clearer path to your next skill
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Learn with purpose. <span className="text-indigo-700">Grow with confidence.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Discover practical courses, follow structured lessons, and see your progress build from your first session to course completion.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/courses")}
                className="rounded-xl bg-indigo-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                Explore courses
              </button>
              <a
                href="#features"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                How it works
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-slate-600">
              <span><FontAwesomeIcon icon={faAward} className="mr-2 text-indigo-600" />Progress you can track</span>
              <span><FontAwesomeIcon icon={faStar} className="mr-2 text-amber-500" />Learning at your pace</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-indigo-200/60 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-8 -right-6 h-40 w-40 rounded-full bg-purple-200/60 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-3xl border border-white/80 bg-white p-3 shadow-2xl shadow-indigo-200/50">
              <img src={bannerImg} alt="Learners building skills through online courses" className="h-[280px] w-full rounded-2xl object-cover sm:h-[380px]" />
              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg backdrop-blur sm:bottom-9 sm:left-9 sm:right-9">
                <p className="text-sm font-semibold text-slate-500">Your learning journey</p>
                <p className="mt-1 text-lg font-bold text-slate-900">Explore. Practice. Achieve.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Awesome Features</h1>
        <p className="text-gray-600 mb-10">Chance to enhance yourself</p>
        <div className="grid md:grid-cols-3 gap-8 md:px-24">
          {featureData.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <FontAwesomeIcon
                icon={feature.icon}
                className={`text-${feature.color}-500 text-4xl text-warning-dark mb-4`}
              />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses Section */}
      <section id="course" className="px-6 py-16 bg-gray-100">
        <h1 className="text-3xl font-bold text-center mb-4">
          Our Popular Courses
        </h1>
        <p className="text-gray-600 text-center mb-10">
          {coursesLoading ? "Loading courses…" : `${courses.length} featured courses from the live catalog`}
        </p>
        {coursesError && <p className="mb-6 text-center text-red-700" role="alert">{coursesError}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:px-24">
          {!coursesLoading && courses.map((course) => (
            <button
              key={course.course_id}
              type="button"
              onClick={() => navigate(`/course/${course.course_id}`)}
              className="overflow-hidden rounded-xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {course.p_link ? (
                <img src={course.p_link} alt="" className="h-40 w-full bg-slate-100 object-cover" loading="lazy" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-indigo-50 text-indigo-700">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-4xl" aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-slate-900">{course.course_name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.description}</p>
                <p className="mt-3 text-sm font-medium text-indigo-700">
                  {course.instructor ? `Instructor: ${course.instructor}` : "Explore course"}
                </p>
                <p className="mt-1 font-semibold text-slate-900">{course.price ? `₹${course.price}` : "Free"}</p>
              </div>
            </button>
          ))}
          {!coursesLoading && !coursesError && courses.length === 0 && (
            <p className="col-span-full rounded-xl bg-white p-8 text-center text-slate-600">No courses are available yet.</p>
          )}
        </div>
      </section>

      {/* Registration call to action */}
      <section className="relative px-6 py-24 flex flex-col items-center justify-center text-center bg-secondary/20">
        <div className="relative z-10 max-w-3xl">
          <p className="font-bold mb-4 text-lg uppercase tracking-wider text-warning-dark">
            LearnSphere
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
            Start your learning journey
          </h1>
          <p className="mb-12 text-lg">
            Create an account to enroll in courses, access your learning materials, and track your progress.
          </p>
          <button type="button" onClick={() => navigate("/register")} className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
            Create your account
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
