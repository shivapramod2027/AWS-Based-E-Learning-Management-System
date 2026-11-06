import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../Components/common/Navbar";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { courseService } from "../../api/course.service";
import { learningService } from "../../api/learning.service";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [displayCount, setDisplayCount] = useState(6);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  
  const userId = localStorage.getItem("id");
  const authToken = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseService.getAllCourses();
        if (coursesRes.success) {
          setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
          setLoadError("");
        } else {
          setLoadError(coursesRes.error);
        }

        if (userId) {
          const enrollmentsRes = await learningService.getEnrollments(userId);
          if (enrollmentsRes.success) {
            setEnrolled(enrollmentsRes.data.map((item) => item.course_id));
          }
        }
      } catch (err) {
        console.error("Error loading courses:", err);
        setLoadError("Unable to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, retryCount]);

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch = [course.course_name, course.instructor, course.description, course.topic]
        .some((value) => (value || "").toLowerCase().includes(search));
      const matchesTopic = !topicFilter || course.topic === topicFilter;
      const matchesDifficulty = !difficultyFilter || course.difficulty === difficultyFilter;
      const price = Number(String(course.price ?? 0).replace(/[^0-9.]/g, "")) || 0;
      const matchesMinPrice = minPrice === "" || price >= Number(minPrice);
      const matchesMaxPrice = maxPrice === "" || price <= Number(maxPrice);
      if (!matchesSearch || !matchesTopic || !matchesDifficulty || !matchesMinPrice || !matchesMaxPrice) return false;
      
      if (filterBy === "enrolled") return matchesSearch && enrolled.includes(course.course_id);
      if (filterBy === "available") return matchesSearch && !enrolled.includes(course.course_id);
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.course_name.localeCompare(b.course_name);
        case "instructor":
          return a.instructor.localeCompare(b.instructor);
        case "price":
          const priceA = parseFloat(String(a.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(String(b.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
          return priceA - priceB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, sortBy, filterBy, enrolled, minPrice, maxPrice, topicFilter, difficultyFilter]);

  const displayedCourses = filteredAndSortedCourses.slice(0, displayCount);
  const topics = [...new Set(courses.map((course) => course.topic).filter(Boolean))].sort();

  const enrollCourse = async (courseId) => {
    const course = courses.find((item) => item.course_id === courseId);
    if (Number(course?.price) > 0) {
      navigate(`/course/${courseId}`);
      return;
    }
    if (!authToken) {
      message.error("You need to login to continue");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const res = await learningService.enrollCourse(userId, courseId);
    if (res.success && res.data === "Enrolled successfully") {
      message.success("Course Enrolled successfully");
      setTimeout(() => navigate(`/learn/${courseId}`), 800);
    }
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 6);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar page="courses" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses, instructors, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <input
                type="number"
                min="0"
                aria-label="Minimum course price"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                min="0"
                aria-label="Maximum course price"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                aria-label="Filter by topic"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">All topics</option>
                {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
              <select
                aria-label="Filter by difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">All levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Unspecified">Unspecified</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="instructor">Sort by Instructor</option>
                <option value="price">Sort by Price</option>
              </select>
              
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Courses</option>
                <option value="available">Available</option>
                <option value="enrolled">Enrolled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {displayedCourses.length} of {filteredAndSortedCourses.length} courses</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-12 text-center" role="alert">
            <p className="text-gray-700">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRetryCount((count) => count + 1);
              }}
              className="mt-4 rounded-lg bg-indigo-700 px-5 py-2.5 font-semibold text-white hover:bg-indigo-800"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No courses found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {displayedCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group backdrop-blur-sm"
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={course.p_link} 
                      alt={course.course_name} 
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        {Number(course.price) > 0 ? `₹${course.price}` : "Free"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {(course.course_name || "").length < 8 ? `${course.course_name} Tutorial` : course.course_name}
                    </h3>
                    {(course.topic || course.difficulty) && (
                      <p className="mb-3 flex flex-wrap gap-2 text-xs">
                        {course.topic && <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">{course.topic}</span>}
                        {course.difficulty && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{course.difficulty}</span>}
                      </p>
                    )}
                    
                    <p className="text-gray-500 text-sm mb-6 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      by {course.instructor}
                    </p>
                    <div className="mb-4 flex flex-wrap gap-2 text-xs">
                      {course.topic && <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">{course.topic}</span>}
                      {course.difficulty && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{course.difficulty}</span>}
                      {course.duration && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{course.duration}</span>}
                      {course.rating !== null && course.rating !== undefined && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">★ {Number(course.rating).toFixed(1)}</span>}
                    </div>

                    {enrolled.includes(course.course_id) ? (
                      <button
                        onClick={() => navigate(`/learn/${course.course_id}`)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200 shadow-md hover:shadow-lg"
                      >
                        ✓ Enrolled
                      </button>
                    ) : (
                      <button
                        onClick={() => enrollCourse(course.course_id)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {Number(course.price) > 0 ? "View and buy course" : "Enroll Now"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {displayedCourses.length < filteredAndSortedCourses.length && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                >
                  Load More Courses
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Courses;