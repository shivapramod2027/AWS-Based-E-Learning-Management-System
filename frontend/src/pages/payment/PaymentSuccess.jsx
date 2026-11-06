import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import Navbar from "../../Components/common/Navbar";
import { paymentService } from "../../api/payment.service";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    let active = true;
    if (!orderId) {
      setError("The Cashfree order is missing. If you completed payment, contact support.");
      setStatus("error");
      return () => { active = false; };
    }

    paymentService.confirmCheckout(orderId).then((result) => {
      if (!active) return;
      if (!result.success) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setCourseId(result.data.courseId);
      setStatus(result.data.status === "PAID" ? "paid" : "pending");
    });
    return () => { active = false; };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-xl justify-center px-4 py-16">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {status === "checking" && (
            <>
              <LoaderCircle className="mx-auto animate-spin text-indigo-700" size={42} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">Confirming your payment</h1>
              <p className="mt-2 text-slate-600">We’re verifying the payment securely with Cashfree.</p>
            </>
          )}
          {status === "paid" && (
            <>
              <CheckCircle2 className="mx-auto text-emerald-600" size={48} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">Payment confirmed</h1>
              <p className="mt-2 text-slate-600">You’re enrolled. Your course is ready to start.</p>
              <Link to={`/learn/${courseId}`} className="mt-6 inline-flex rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">
                Start learning
              </Link>
            </>
          )}
          {status === "pending" && (
            <>
              <LoaderCircle className="mx-auto text-amber-600" size={44} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">Payment is processing</h1>
              <p className="mt-2 text-slate-600">Enrollment will be available once Cashfree confirms the payment.</p>
              <Link to="/learnings" className="mt-6 inline-flex font-semibold text-indigo-700 hover:underline">Check my courses</Link>
            </>
          )}
          {status === "error" && (
            <>
              <CircleAlert className="mx-auto text-red-600" size={44} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">We couldn’t confirm this payment</h1>
              <p className="mt-2 text-red-700" role="alert">{error}</p>
              <p className="mt-3 text-sm text-slate-600">If you were charged, your enrollment will be completed after Cashfree confirms the payment. You can also contact support with your payment receipt.</p>
              <Link to="/courses" className="mt-6 inline-flex font-semibold text-indigo-700 hover:underline">Return to courses</Link>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default PaymentSuccess;
