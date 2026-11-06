import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import Navbar from "../../Components/common/Navbar";
import { paymentService } from "../../api/payment.service";

function DemoPayment() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const orderId = searchParams.get("order_id");
  const checkout = location.state?.checkout;

  const simulatePayment = async () => {
    if (!orderId) {
      setError("The demo payment order is missing. Return to the course and try again.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const result = await paymentService.confirmCheckout(orderId);
      if (!result.success) {
        setError(result.error || "Could not complete the demo payment.");
        return;
      }
      navigate(`/payment/success?order_id=${encodeURIComponent(orderId)}&mode=demo`, {
        replace: true,
        state: { payment: result.data, mode: "demo" },
      });
    } catch (paymentError) {
      console.error("Could not complete demo payment:", paymentError);
      setError("Could not finish the simulated payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-xl justify-center px-4 py-16">
        <section className="w-full overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
          <div className="bg-amber-50 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              {processing
                ? <LoaderCircle className="animate-spin" size={30} aria-hidden="true" />
                : <CreditCard size={30} aria-hidden="true" />}
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-amber-800">College project demo</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Review simulated payment</h1>
            <p className="mt-2 text-sm text-slate-600">This is a demo only. No card details are requested and no money will be charged.</p>
          </div>
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{checkout?.courseName || "Selected course"}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-600">Course price (display only)</span>
                <span className="text-xl font-bold text-slate-900">
                  {checkout?.amount != null ? new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: checkout.currency || "INR",
                    maximumFractionDigits: 2,
                  }).format(checkout.amount) : "Demo purchase"}
                </span>
              </div>
              {orderId && <p className="mt-2 break-all text-xs text-slate-500">Order reference: {orderId}</p>}
            </div>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-800">1</span><span>Review the course and demo amount above.</span></li>
              <li className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-800">2</span><span>Click below to simulate a successful payment.</span></li>
              <li className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-800">3</span><span>Your enrollment is activated and you can start learning.</span></li>
            </ol>
            <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              No real payment is processed. This button only records a simulated success for your project demo.
            </p>
            {(error || !orderId) && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
                {error || "The demo payment order is missing. Return to the course and try again."}
              </p>
            )}
            <button
              type="button"
              onClick={simulatePayment}
              disabled={processing || !orderId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? <><LoaderCircle className="animate-spin" size={18} /> Activating enrollment…</> : <>Simulate payment and enroll <ArrowRight size={18} /></>}
            </button>
            <Link
              to={checkout?.courseId ? `/course/${checkout.courseId}` : "/courses"}
              className="block text-center text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel and return to course
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DemoPayment;
