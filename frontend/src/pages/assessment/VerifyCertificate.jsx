import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { certificateService } from "../../api/certificate.service";

function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    certificateService.verify(code).then((response) => {
      if (active) {
        setResult(response.success ? response.data : null);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [code]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">LearnSphere</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Certificate verification</h1>
        {loading ? <p className="mt-6" role="status">Verifying certificate…</p> : result ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-left">
            <p className="font-bold text-green-800">Valid certificate</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Learner</dt><dd className="font-semibold text-slate-900">{result.learnerName}</dd></div>
              <div><dt className="text-slate-500">Course</dt><dd className="font-semibold text-slate-900">{result.courseName}</dd></div>
              <div><dt className="text-slate-500">Issued</dt><dd className="font-semibold text-slate-900">{new Date(result.issuedAt).toLocaleDateString()}</dd></div>
              <div><dt className="text-slate-500">Certificate ID</dt><dd className="break-all font-semibold text-slate-900">{result.verificationCode}</dd></div>
            </dl>
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-red-50 p-5 font-semibold text-red-800">This certificate ID is invalid or could not be found.</p>
        )}
        <Link to="/" className="mt-6 inline-block font-semibold text-indigo-700 hover:text-indigo-900">Return to LearnSphere</Link>
      </section>
    </main>
  );
}

export default VerifyCertificate;
