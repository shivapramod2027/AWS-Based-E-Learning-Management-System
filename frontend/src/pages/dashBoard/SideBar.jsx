import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../api/auth.service";

function SideBar({ current, onSelect }) {
  const navigate = useNavigate();
  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: "bx bxs-dashboard" },
    { key: "user", label: "Users", icon: "bx bxs-group" },
    { key: "courses", label: "Courses", icon: "bx bxs-book" },
    { key: "enrollments", label: "Enrollments", icon: "bx bx-list-check" },
    { key: "assignments", label: "Assignments", icon: "bx bx-edit" },
  ];

  return (
    <div className="w-full shrink-0 bg-white shadow-lg flex flex-col p-4 md:min-h-screen md:w-64">
      <button
        type="button"
        className="flex items-center gap-3 border-b border-gray-200 px-3 py-5 text-left"
        onClick={() => onSelect("dashboard")}
        aria-label="LearnSphere admin dashboard"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white"><GraduationCap size={23} aria-hidden="true" /></span>
        <span className="text-lg font-semibold text-blue-900">LearnSphere</span>
      </button>
      <ul className="flex flex-col mt-6">
        {menuItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-3 p-3 transition-colors rounded-lg mx-3 mb-3 text-left ${
                current === item.key
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className={`${item.icon} text-lg`} />
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          authService.logout();
          navigate("/login", { replace: true });
        }}
        aria-label="Log out of the admin dashboard"
        className="w-full flex items-center gap-3 p-3 mt-auto text-left text-gray-700 transition-colors rounded-lg hover:bg-red-50 hover:text-red-700"
      >
        <i className="bx bx-log-out text-lg" />
        <span className="font-medium">Log out</span>
      </button>
    </div>
  );
}

export default SideBar;
