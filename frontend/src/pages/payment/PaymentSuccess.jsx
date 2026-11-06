import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { BadgeCheck, CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import Navbar from "../../Components/common/Navbar";
import { paymentService } from "../../api/payment.service";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");
  const orderId = searchParams.get("order_id");
  const isDemo = searchParams.get("mode") === "demo" || location.state?.mode === "demo";

  useEffect(() => {
    let active = true;
    const confirmedPayment = location.state?.payment;
    if (confirmedPayment?.status === "PAID") {
      setCourseId(confirmedPayment.courseId);
      setStatus("paid");
      return () => { active = false; };
    }
    if (!orderId) {
      setError("The payment order is missing. Return to the course and try again.");
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
  }, [orderId, location.state]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-xl justify-center px-4 py-16">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {status === "checking" && (
            <>
              <LoaderCircle className="mx-auto animate-spin text-indigo-700" size={42} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">{isDemo ? "Confirming demo enrollment" : "Confirming your payment"}</h1>
              <p className="mt-2 text-slate-600">{isDemo ? "We’re recording the simulated payment. No money will be charged." : "We’re verifying the payment securely with Cashfree."}</p>
            </>
          )}
          {status === "paid" && (
            <>
              {isDemo
                ? <BadgeCheck className="mx-auto text-emerald-600" size={48} aria-hidden="true" />
                : <CheckCircle2 className="mx-auto text-emerald-600" size={48} aria-hidden="true" />}
              <h1 className="mt-4 text-2xl font-bold text-slate-900">{isDemo ? "Demo payment successful" : "Payment confirmed"}</h1>
              <p className="mt-2 text-slate-600">{isDemo ? "No money was charged. Your course enrollment is active and ready." : "You’re enrolled. Your course is ready to start."}</p>
              <Link to={`/learn/${courseId}`} className="mt-6 inline-flex rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">
                Start learning
              </Link>
            </>
          )}
          {status === "pending" && (
            <>
              <LoaderCircle className="mx-auto text-amber-600" size={44} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">{isDemo ? "Demo enrollment is processing" : "Payment is processing"}</h1>
              <p className="mt-2 text-slate-600">{isDemo ? "Your simulated payment is still being recorded." : "Enrollment will be available once Cashfree confirms the payment."}</p>
              <Link to="/learnings" className="mt-6 inline-flex font-semibold text-indigo-700 hover:underline">Check my courses</Link>
            </>
          )}
          {status === "error" && (
            <>
              <CircleAlert className="mx-auto text-red-600" size={44} aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">We couldn’t confirm this payment</h1>
              <p className="mt-2 text-red-700" role="alert">{error}</p>
              <p className="mt-3 text-sm text-slate-600">
                {isDemo
                  ? "No money was charged. Return to the course and retry the demo checkout."
                  : "If you were charged, your enrollment will be completed after Cashfree confirms the payment. You can also contact support with your payment receipt."}
              </p>
              <Link to="/courses" className="mt-6 inline-flex font-semibold text-indigo-700 hover:underline">Return to courses</Link>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default PaymentSuccess;
