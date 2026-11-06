import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, LoaderCircle } from "lucide-react";
import Navbar from "../../Components/common/Navbar";
import { paymentService } from "../../api/payment.service";

function DemoPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const orderId = searchParams.get("order_id");

  const simulatePayment = async () => {
    if (!orderId) {
      setError("The demo payment order is missing. Return to the course and try again.");
      return;
    }
    setProcessing(true);
    setError("");
    const result = await paymentService.confirmCheckout(orderId);
    setProcessing(false);
    if (!result.success) {
      setError(result.error || "Could not complete the demo payment.");
      return;
    }
    navigate(`/payment/success?order_id=${encodeURIComponent(orderId)}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-xl justify-center px-4 py-16">
        <section className="w-full rounded-2xl border border-amber-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            {processing
              ? <LoaderCircle className="animate-spin" size={30} aria-hidden="true" />
              : <CircleAlert size={30} aria-hidden="true" />}
          </div>
          <p className="mt-4 text-sm font-bold uppercase tracking-wider text-amber-800">College project demo</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Simulated payment</h1>
          <p className="mt-3 text-slate-600">
            No real payment will be collected. Confirm below to simulate a successful payment and enroll in the course.
          </p>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
          <button
            type="button"
            onClick={simulatePayment}
            disabled={processing || !orderId}
            className="mt-6 w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? "Processing demo payment…" : "Simulate successful payment"}
          </button>
          <Link
            to="/courses"
            className="mt-4 inline-block text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Link>
        </section>
      </main>
    </div>
  );
}

export default DemoPayment;
