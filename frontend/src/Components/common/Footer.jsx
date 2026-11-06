import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-slate-950 px-6 py-10 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="text-lg font-bold text-white">LearnSphere</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            A cloud-based learning platform for building practical skills through guided courses and hands-on study.
          </p>
        </div>
        <nav aria-label="Learning links">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white focus:outline-none focus:underline" to="/courses">Course catalog</Link></li>
            <li><Link className="hover:text-white focus:outline-none focus:underline" to="/register">Create an account</Link></li>
            <li><Link className="hover:text-white focus:outline-none focus:underline" to="/login">Sign in</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">About the platform</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            LearnSphere brings course discovery, enrollment, assessments, and progress tracking together in one place.
          </p>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl border-t border-slate-800 pt-5 text-sm text-slate-400">
        © {new Date().getFullYear()} LearnSphere. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
