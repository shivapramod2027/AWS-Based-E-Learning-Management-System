import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import Confetti from "react-dom-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faShare,
  faAward,
  faCalendar,
  faIdCard,
  faCheckCircle,
  faGraduationCap,
  faStar,
  faArrowLeft,
  faCertificate,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faTwitter, faFacebook } from "@fortawesome/free-brands-svg-icons";
import seal from '../../assets/images/seal.png';
import { courseService } from "../../api/course.service";
import { profileService } from "../../api/profile.service";
import { certificateService } from "../../api/certificate.service";

const Certificate = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const authToken = localStorage.getItem("token");
  const userId = localStorage.getItem("id");
  
  const [course, setCourse] = useState({
    course_name: "",
    instructor: "",
    description: "",
  });

  const currentDate = certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "";
  const certificateCourseTitle = course?.course_name?.length > 50
    ? course.course_name
    : `${course?.course_name || "Course"} - Complete Course`;

  useEffect(() => {
    const issuedCertificate = location.state?.certificate;
    if (issuedCertificate) {
      setCertificate(issuedCertificate);
      setUserDetails({ username: issuedCertificate.learnerName });
      setCourse((currentCourse) => ({
        ...currentCourse,
        course_name: issuedCertificate.courseName,
      }));
      setShowConfetti(true);
      setLoading(false);
      return;
    }

    if (!authToken) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, courseRes, certificateRes] = await Promise.all([
          profileService.getUserDetails(userId),
          courseService.getCourseById(courseId),
          certificateService.issue(courseId)
        ]);

        if (userRes.success) {
          setUserDetails(userRes.data);
        } else {
          throw new Error("Failed to fetch user details");
        }

        if (courseRes.success) {
          setCourse(courseRes.data);          
        } else {
          throw new Error("Failed to fetch course details");
        }
        if (certificateRes.success) {
          setCertificate(certificateRes.data);
        } else {
          throw new Error(certificateRes.error || "Certificate is not available yet");
        }

        // Show confetti after data loads
        setTimeout(() => setShowConfetti(true), 500);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load certificate data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken, navigate, userId, courseId, location.state]);

  const handleDownloadPDF = () => {
    setPdfDownloading(true);
    setDownloadError("");
    
    try {
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const center = pageWidth / 2;
      const learnerName = certificate?.learnerName || userDetails?.username || "Student";
      const courseName = certificateCourseTitle;
      const issuedDate = currentDate || "Completion date";
      const verificationCode = certificate?.verificationCode || "Not available";

      pdf.setProperties({
        title: `${courseName} Certificate`,
        subject: "LearnSphere course completion certificate",
        author: "LearnSphere",
      });

      pdf.setFillColor(255, 253, 247);
      pdf.rect(0, 0, pageWidth, 210, "F");
      pdf.setDrawColor(30, 41, 59);
      pdf.setLineWidth(1.4);
      pdf.rect(7, 7, pageWidth - 14, 196, "S");
      pdf.setDrawColor(217, 164, 65);
      pdf.setLineWidth(0.7);
      pdf.rect(11, 11, pageWidth - 22, 188, "S");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text("LearnSphere", center, 27, { align: "center" });

      pdf.setFontSize(9);
      pdf.setTextColor(161, 98, 7);
      pdf.text("CERTIFICATE OF COMPLETION", center, 40, { align: "center", charSpace: 2 });
      pdf.setFont("times", "bold");
      pdf.setFontSize(32);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Certificate", center, 55, { align: "center" });

      pdf.setDrawColor(217, 164, 65);
      pdf.line(50, 62, pageWidth - 50, 62);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text("THIS IS PROUDLY PRESENTED TO", center, 74, { align: "center", charSpace: 1.5 });

      pdf.setFont("times", "bold");
      pdf.setFontSize(27);
      pdf.setTextColor(30, 41, 59);
      pdf.text(pdf.splitTextToSize(learnerName, pageWidth - 60), center, 88, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(71, 85, 105);
      pdf.text("For successfully completing the course", center, 104, { align: "center" });

      pdf.setFillColor(30, 41, 59);
      pdf.setDrawColor(217, 164, 65);
      pdf.roundedRect(38, 111, pageWidth - 76, 29, 3, 3, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(19);
      pdf.setTextColor(255, 255, 255);
      pdf.text(pdf.splitTextToSize(courseName, pageWidth - 92), center, 127, { align: "center" });

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(11);
      pdf.setTextColor(75, 85, 99);
      pdf.text("In recognition of the dedication, skill, and commitment shown throughout this learning journey.", center, 151, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`DATE ISSUED  ${issuedDate}`, 48, 168);
      pdf.text(`CERTIFICATE ID  ${verificationCode}`, 48, 178);
      pdf.setFontSize(9);
      pdf.text(`Verify online: ${window.location.origin}/verify/${verificationCode}`, 48, 188);
      pdf.setDrawColor(37, 99, 145);
      pdf.setLineWidth(1.2);
      pdf.circle(pageWidth - 49, 174, 16, "S");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(37, 99, 145);
      pdf.text("VERIFIED", pageWidth - 49, 173, { align: "center" });
      pdf.setFontSize(5);
      pdf.text("LEARNSPHERE", pageWidth - 49, 178, { align: "center" });

      const filename = `${userDetails?.username || "Certificate"}_${course?.course_name || "Course"}_Certificate.pdf`
        .replace(/[<>:"/\\|?*]+/g, "_");
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err instanceof Error
        ? `Certificate download failed: ${err.message}`
        : "The certificate could not be downloaded. Please try again.");
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleShare = (platform) => {
    const shareText = `🎉 I just completed ${course?.course_name} and earned my certificate! #Achievement #Learning`;
    const shareUrl = `${window.location.origin}/verify/${certificate?.verificationCode}`;
    
    const urls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Preparing Your Certificate</h3>
          <p className="text-gray-600">Please wait while we generate your achievement certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <FontAwesomeIcon icon={faAward} className="text-6xl text-red-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Achievement unlocked</p>
            <p className="mt-1 text-slate-600">Congratulations on completing your course.</p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <div
            id="certificate"
            className="relative overflow-hidden rounded-2xl border border-amber-400 bg-slate-950 p-1.5 shadow-[0_28px_80px_-30px_rgba(15,23,42,0.55)] sm:p-2"
          >
            <div className="relative border border-amber-300 p-1.5 sm:p-2">
              <div className="relative overflow-hidden border border-amber-300/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-[#fffdf7] to-[#f8f3e7] px-5 py-8 text-center sm:px-10 sm:py-10 lg:px-16 lg:py-12">
                <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full border border-amber-200/70" />
                <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full border border-amber-200/60" />
                <div className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full border border-amber-200/70" />
                <div className="pointer-events-none absolute -bottom-24 -right-16 h-52 w-52 rounded-full border border-amber-200/60" />

                <div className="relative mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-5 py-2 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-amber-300">
                    <FontAwesomeIcon icon={faGraduationCap} aria-hidden="true" />
                  </span>
                  <span className="text-lg font-bold tracking-tight text-slate-900">LearnSphere</span>
                </div>

                <p className="relative mt-7 text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Official course recognition</p>
                <h1 className="relative mt-3 font-serif text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Certificate of Completion
                </h1>
                <div className="relative mx-auto mt-5 flex max-w-xl items-center gap-4 text-amber-600">
                  <span className="h-px flex-1 bg-amber-300" />
                  <FontAwesomeIcon icon={faStar} className="text-lg" aria-hidden="true" />
                  <span className="h-px flex-1 bg-amber-300" />
                </div>

                <p className="relative mt-7 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Proudly presented to</p>
                <h2 className="relative mx-auto mt-3 max-w-4xl break-words font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl lg:text-5xl">
                  {certificate?.learnerName || userDetails?.username || "Student"}
                </h2>
                <div className="mx-auto mt-3 h-0.5 w-36 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

                <p className="relative mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  For successfully completing the course
                </p>
                <div className="relative mx-auto mt-5 max-w-3xl rounded-lg border border-amber-400 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 px-5 py-5 shadow-xl shadow-slate-900/20 sm:px-8">
                  <h3 className="break-words text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-3xl">
                    {certificateCourseTitle}
                  </h3>
                </div>
                <p className="relative mt-6 text-sm leading-6 text-slate-600 sm:text-base">
                  In recognition of the dedication, skill, and commitment demonstrated throughout this learning journey.
                </p>

                <div className="relative mx-auto mt-9 grid max-w-4xl gap-5 border-y border-amber-200 py-5 text-left sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                      <FontAwesomeIcon icon={faCalendar} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Date issued</p>
                      <p className="mt-1 font-semibold text-slate-900">{currentDate}</p>
                    </div>
                  </div>

                  <div className="hidden h-10 w-px bg-amber-200 sm:block" />

                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
                      <FontAwesomeIcon icon={faIdCard} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Certificate ID</p>
                      <p className="mt-1 break-all font-semibold text-slate-900">{certificate?.verificationCode}</p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-7 flex flex-col items-center justify-between gap-5 sm:flex-row sm:text-left">
                  <div className="flex items-center gap-3">
                    <img src={seal} alt="Certificate verification seal" className="h-16 w-16 object-contain" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Authenticated achievement</p>
                      <a
                        href={`${window.location.origin}/verify/${certificate?.verificationCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-900"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} aria-hidden="true" />
                        Verify this certificate
                      </a>
                    </div>
                  </div>
                  <div className="w-52 border-t border-slate-400 pt-2 text-center">
                    <p className="font-serif text-lg italic text-slate-800">LearnSphere</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Authorized platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div id="certificate-buttons" className="flex flex-wrap justify-center gap-4 mt-8">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfDownloading}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {pdfDownloading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="text-xl" />
                  Download Certificate
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FontAwesomeIcon icon={faLinkedin} className="text-xl" />
                LinkedIn
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FontAwesomeIcon icon={faTwitter} className="text-xl" />
                Twitter
              </button>
              
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FontAwesomeIcon icon={faFacebook} className="text-xl" />
                Facebook
              </button>
            </div>
          </div>
          {downloadError && (
            <p className="mt-4 text-center text-sm text-red-700" role="alert">{downloadError}</p>
          )}

          {/* Certificate Info */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">About Your Achievement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-indigo-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Course Completed</h4>
                <p className="text-gray-600 text-sm">You have successfully finished all course requirements</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <FontAwesomeIcon icon={faCertificate} className="text-3xl text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Verified Certificate</h4>
                <p className="text-gray-600 text-sm">This certificate is digitally verified and authentic</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <FontAwesomeIcon icon={faShare} className="text-3xl text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Share Your Success</h4>
                <p className="text-gray-600 text-sm">Show your achievement on social media platforms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;