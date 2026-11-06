import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChalkboardUser } from "@fortawesome/free-solid-svg-icons";
import { authService } from "../../api/auth.service";
import { notificationService } from "../../api/notification.service";
import { GraduationCap, Menu, X } from "lucide-react";

function Navbar(props) {
  const value = props.page;
  const navigate = useNavigate();
  const isAuthenticated = authService.isUserAuthenticated();
  const isAdmin = authService.isAdminAuthenticated();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      notificationService.getUnreadCount().then((result) => {
        if (active && result.success) setUnreadCount(result.data);
      });
    }
    return () => { active = false; };
  }, [isAuthenticated]);

  const handleLogOut = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div>
      <nav className="relative z-[999] flex w-full flex-row items-center justify-between bg-white px-[4vw] shadow-[2px_2px_10px_rgba(0,0,0,0.15)]">
        <Link to={isAdmin ? "/admin" : "/"} aria-label="LearnSphere home" className="flex shrink-0 items-center gap-3 py-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-700 to-violet-600 text-white shadow-sm">
            <GraduationCap size={24} aria-hidden="true" />
          </span>
          <span className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
            LearnSphere
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Cloud learning</span>
          </span>
        </Link>
        <div className="flex items-center">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <ul
            className={`${isMobileMenuOpen
              ? "absolute left-0 top-full flex w-full flex-col items-stretch gap-4 border-t border-slate-100 bg-white px-[4vw] py-5 shadow-lg md:static md:w-auto md:flex-row md:items-center md:gap-0 md:border-0 md:p-0 md:shadow-none"
              : "hidden md:flex"} justify-end`}
            onClick={(event) => {
              if (event.target instanceof Element && event.target.closest("a, button")) closeMobileMenu();
            }}
          >
            {value === "home" ? (
              <li className="list-none ml-5 rounded-[5px] bg-gradient-to-r from-blue-600 to-purple-600">
                <Link 
                  to={"/"} 
                  className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-[10px] py-[2px] block hover:text-yellow-400"
                >
                  Home
                </Link>
              </li>
            ) : (
              <li className="list-none ml-5">
                <Link 
                  to={"/"}
                  className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-yellow-400"
                >
                  Home
                </Link>
              </li>
            )}
            {isAuthenticated && (
              <li className="list-none ml-5">
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-indigo-700"
                >
                  Dashboard
                </Link>
              </li>
            )}
            {value === "courses" ? (
              <li className="list-none ml-5 rounded-[5px] bg-gradient-to-r from-blue-600 to-purple-600">
                <Link
                  to={"/courses"}
                  className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-[10px] py-[2px] block hover:text-yellow-400"
                >
                  Courses
                </Link>
              </li>
            ) : (
              <li className="list-none ml-5">
                <Link 
                  to={"/courses"}
                  className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-yellow-400"
                >
                  Courses
                </Link>
              </li>
            )}
            {isAuthenticated && !isAdmin && (
              <>
                <li className="list-none ml-5">
                  <Link to="/assignments" className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-indigo-700">
                    Assignments
                  </Link>
                </li>
                <li className="list-none ml-5">
                  <Link to="/notifications" className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-indigo-700">
                    Notifications{unreadCount > 0 && <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 align-middle text-xs text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </Link>
                </li>
              </>
            )}
            {isAuthenticated && !isAdmin ? (
              value === "profile" ? (
                <li className="list-none ml-5 rounded-[5px] bg-gradient-to-r from-blue-600 to-purple-600">
                  <Link
                    to={"/profile"}
                    className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-[10px] py-[2px] block hover:text-yellow-400"
                  >
                    Profile
                    <FontAwesomeIcon icon={faUser} className="ml-1" />
                  </Link>
                </li>
              ) : (
                <li className="list-none ml-5">
                  <Link 
                    to={"/profile"}
                    className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-yellow-400"
                  >
                    Profile
                    <FontAwesomeIcon icon={faUser} className="ml-1" />
                  </Link>
                </li>
              )
            ) : (
              <></>
            )}
            {isAuthenticated && !isAdmin ? (
              value === "learnings" ? (
                <li className="list-none ml-5 rounded-[5px] bg-gradient-to-r from-blue-600 to-purple-600">
                  <Link
                    to={"/learnings"}
                    className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-[10px] py-[2px] block hover:text-yellow-400"
                  >
                    Learnings
                    <FontAwesomeIcon icon={faChalkboardUser} className="ml-1" />
                  </Link>
                </li>
              ) : (
                <li className="list-none ml-5">
                  <Link 
                    to={"/learnings"}
                    className="no-underline text-[rgb(21,21,100)] text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-yellow-400"
                  >
                    Learnings
                    <FontAwesomeIcon icon={faChalkboardUser} className="ml-1" />
                  </Link>
                </li>
              )
            ) : (
              <></>
            )}
            {isAuthenticated ? (
              <li className="list-none ml-5">
                <button 
                  onClick={handleLogOut} 
                  className="w-[120px] h-[35px] p-[1px] mb-[1px] bg-[#0047ca] border-none rounded-lg text-[rgb(250,250,250)] text-[15px] font-medium cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#002c5fe1]"
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <li className="list-none ml-5">
                <button 
                  onClick={() => navigate("/login")}
                  className="w-[120px] h-[35px] p-[1px] mb-[1px] bg-[#0047ca] border-none rounded-lg text-[rgb(250,250,250)] text-[15px] font-medium cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#002c5fe1]"
                >
                  Login/SignUp
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;