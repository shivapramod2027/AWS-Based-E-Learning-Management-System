import { useState } from "react";
import Courses from "./DCourses";
import Dashboard from "./Dashboard";
import SideBar from "./SideBar";
import Users from "./DUsers";
import Enrollments from "./Enrollments";
import AssignmentsAdmin from "./AssignmentsAdmin";

function AdminDashboard() {
  const [current, setCurrent] = useState("dashboard");

  const renderContent = () => {
    switch (current) {
      case "user":
        return <Users />;
      case "courses":
        return <Courses />;
      case "enrollments":
        return <Enrollments />;
      case "assignments":
        return <AssignmentsAdmin />;
      default:
        return <Dashboard onNavigate={setCurrent} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SideBar current={current} onSelect={setCurrent} />
      <section className="flex-1 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
        <main className="p-4 font-poppins sm:p-8">{renderContent()}</main>
      </section>
    </div>
  );
}

export default AdminDashboard;
