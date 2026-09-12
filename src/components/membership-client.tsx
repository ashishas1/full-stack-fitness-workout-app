"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  Flame,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  Lock,
  QrCode,
  Receipt,
  RotateCcw,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Modal, PageHeader } from "@/components/ui";
import { cx, fmtDate } from "@/lib/utils";

type PaymentRecord = {
  id: number;
  tier: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string | Date;
};

type MembershipClientProps = {
  initialTier: string;
  initialExpiresAt: Date | null;
  initialPayments: PaymentRecord[];
  username: string;
};

const PLANS = [
  {
    id: "monthly",
    name: "Monthly Pro",
    price: 99,
    period: "/ month",
    badge: null,
    popular: false,
    tagline: "Monthly flexibility to chisel your core",
    accent: "#c8ff2e",
    accentTone: "volt" as const,
    description: "Full access to the six-pack operating system. Cancel anytime with zero lock-in.",
    perks: [
      "Full 19+ coached exercise library with 3D cues",
      "Interactive live workout companion with audio timer",
      "Unlimited workout logging & streak tracking",
      "Body metrics (weight & waist) trend line charts",
      "Rule-based smart coach workout suggestions",
    ],
  },
  {
    id: "yearly",
    name: "Yearly Elite",
    price: 550,
    period: "/ year",
    badge: "Save ₹638 / year",
    popular: true,
    tagline: "The 12-month serious transformation path",
    accent: "#ff7a29",
    accentTone: "ember" as const,
    description: "The ideal duration to reveal deep definition and maintain rock-hard core strength year-round.",
    perks: [
      "Everything in Monthly Pro",
      "All 4 structured progression workout programs",
      "98-day training volume & activity heat map",
      "Custom exercise creator with personal coaching cues",
      "Elite member badge across dashboard & profile",
      "Priority feature access & updates",
    ],
  },
  {
    id: "lifetime",
    name: "VIP Lifetime",
    price: 1200,
    period: "one-time",
    badge: "VIP Founder",
    popular: false,
    tagline: "Pay once. Master your midline for life.",
    accent: "#ffd700",
    accentTone: "volt" as const,
    description: "Permanent VIP Founder access. No monthly fees, no yearly renewals. Yours forever.",
    perks: [
      "Permanent unlimited lifetime access — forever",
      "All future programs, features & AI coach upgrades included",
      "Distinguished VIP Founder Crown badge on profile",
      "Unlimited custom exercises & workout programs",
      "Priority 1-on-1 routine architecture review",
      "Zero subscriptions. Ever.",
    ],
  },
];

export function MembershipClient({
  initialTier,
  initialExpiresAt,
  initialPayments,
  username,
}: MembershipClientProps) {
  const [currentTier, setCurrentTier] = useState(initialTier);
  const [expiresAt, setExpiresAt] = useState<Date | null>(initialExpiresAt);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[number] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Form states for checkout (empty by default)
  const [paymentMethodTab, setPaymentMethodTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiMode, setUpiMode] = useState<"qr" | "id">("qr");
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>("");
  const [upiId, setUpiId] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Step within modal: 'details' | 'upi_pending' | 'card_otp' | 'bank_auth' | 'verifying' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<
    "details" | "upi_pending" | "card_otp" | "bank_auth" | "verifying" | "success"
  >("details");
  const [otpValue, setOtpValue] = useState("123456");
  const [upiCountdown, setUpiCountdown] = useState(180);

  // Generate real dynamic UPI QR Code when selectedPlan changes
  useEffect(() => {
    if (!selectedPlan) {
      setUpiQrDataUrl("");
      setCheckoutStep("details");
      return;
    }
    const upiUri = `upi://pay?pa=sixforge.fit@icici&pn=SixForge%20Fitness&am=${selectedPlan.price}.00&cu=INR&tn=${encodeURIComponent(selectedPlan.name + " Membership")}`;
    QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setUpiQrDataUrl(url))
      .catch((err) => console.error("QR generation error:", err));
  }, [selectedPlan]);

  // UPI Collect countdown timer
  useEffect(() => {
    if (checkoutStep !== "upi_pending") return;
    const interval = setInterval(() => {
      setUpiCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [checkoutStep]);

  function handleCardNumberChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  }

  function handleExpiryChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  }

  // Developer / User Reset to Free Tier
  async function handleResetMembership() {
    if (isResetting) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/membership/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not reset membership");
        return;
      }
      setCurrentTier("free");
      setExpiresAt(null);
      toast.success("Membership reset to Free Trial. You can now test purchases from scratch!");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error("Network error resetting membership");
    } finally {
      setIsResetting(false);
    }
  }

  // Pre-fill sample values for quick manual testing
  function handleFillTestCard() {
    setCardName(username || "Ashish Test");
    setCardNumber("4532 8901 2345 6789");
    setCardExpiry("12/28");
    setCardCvc("789");
    toast.info("Sample card credentials loaded for test authorization.");
  }

  function handleFillTestUtr() {
    const randomUtr = `423${Math.floor(100000000 + Math.random() * 900000000)}`;
    setUtrNumber(randomUtr);
    toast.info(`Sample 12-digit UTR ${randomUtr} loaded.`);
  }

  function handleFillTestUpi() {
    setUpiId(`${(username || "athlete").toLowerCase().replace(/\s+/g, "")}@okhdfcbank`);
    toast.info("Sample UPI ID loaded.");
  }

  // Step 1: User initiates payment from details form
  async function handleInitiatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || isProcessing) return;

    if (paymentMethodTab === "upi") {
      if (upiMode === "qr") {
        if (!utrNumber.trim() || utrNumber.trim().length < 8) {
          toast.error("Please scan the QR code and enter your 12-digit UPI UTR / Reference number.");
          return;
        }
        await executeVerification(`UPI QR (UTR: ${utrNumber.trim()})`);
      } else {
        if (!upiId.trim() || !upiId.includes("@")) {
          toast.error("Please enter a valid UPI ID (e.g. name@okhdfcbank or phone@paytm)");
          return;
        }
        // Move to UPI App approval screen
        setUpiCountdown(180);
        setCheckoutStep("upi_pending");
      }
    } else if (paymentMethodTab === "card") {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      if (cleanNum.length < 15) {
        toast.error("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardExpiry.includes("/") || cardExpiry.length < 5) {
        toast.error("Please enter expiry in MM/YY format.");
        return;
      }
      if (cardCvc.trim().length < 3) {
        toast.error("Please enter a valid 3-digit CVV.");
        return;
      }
      if (!cardName.trim()) {
        toast.error("Please enter the cardholder name.");
        return;
      }
      // Move to 3D Secure OTP verification
      setCheckoutStep("card_otp");
    } else if (paymentMethodTab === "netbanking") {
      if (!selectedBank) {
        toast.error("Please select your bank.");
        return;
      }
      setCheckoutStep("bank_auth");
    }
  }

  // Final verification & server settlement
  async function executeVerification(methodSummary: string) {
    if (!selectedPlan) return;
    setIsProcessing(true);
    setCheckoutStep("verifying");

    try {
      // Step A: Create Order on Backend
      const orderRes = await fetch("/api/membership/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedPlan.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setCheckoutStep("details");
        toast.error(orderData.error ?? "Failed to create payment order.");
        return;
      }

      // Step B: Verify & Settle
      const verifyRes = await fetch("/api/membership/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.order.orderId,
          token: orderData.order.token,
          tier: selectedPlan.id,
          paymentMethod: methodSummary,
          gatewayPaymentId: `pay_${Date.now()}`,
        }),
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        setCheckoutStep("details");
        toast.error(data.error ?? "Payment verification failed.");
        return;
      }

      // Step C: Success
      setCheckoutStep("success");
      await new Promise((r) => setTimeout(r, 700));

      toast.success(
        `Payment of ₹${selectedPlan.price} verified! Welcome to ${selectedPlan.name}.`
      );
      setCurrentTier(data.tier);
      setExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
      if (data.payment) {
        setPayments((prev) => [data.payment, ...prev]);
      }

      // Reset form states
      setSelectedPlan(null);
      setCheckoutStep("details");
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      setCardName("");
      setUpiId("");
      setUtrNumber("");

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setCheckoutStep("details");
      toast.error("Network error during payment verification. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  const activePlanMeta = PLANS.find((p) => p.id === currentTier);

  return (
    <div>
      <PageHeader
        eyebrow="Membership & Billing"
        title="Forge Membership Tiers"
        sub="Unlock the complete fitness arsenal. Select a plan, scan the UPI QR code or pay with RuPay/Card, and activate instantly."
      />

      {/* Current active membership banner */}
      <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-13 w-13 items-center justify-center rounded-2xl border"
              style={{
                background:
                  currentTier === "lifetime"
                    ? "rgba(255,215,0,0.15)"
                    : currentTier === "yearly"
                      ? "rgba(255,122,41,0.15)"
                      : currentTier === "monthly"
                        ? "rgba(200,255,46,0.15)"
                        : "rgba(255,255,255,0.05)",
                borderColor:
                  currentTier === "lifetime"
                    ? "rgba(255,215,0,0.4)"
                    : currentTier === "yearly"
                      ? "rgba(255,122,41,0.4)"
                      : currentTier === "monthly"
                        ? "rgba(200,255,46,0.4)"
                        : "rgba(255,255,255,0.1)",
                color:
                  currentTier === "lifetime"
                    ? "#ffd700"
                    : currentTier === "yearly"
                      ? "#ff7a29"
                      : currentTier === "monthly"
                        ? "#c8ff2e"
                        : "#8e929a",
              }}
            >
              {currentTier === "lifetime" ? (
                <Crown size={26} />
              ) : currentTier === "yearly" ? (
                <Star size={26} />
              ) : currentTier === "monthly" ? (
                <Zap size={26} />
              ) : (
                <ShieldCheck size={26} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl tracking-wide uppercase">
                  {activePlanMeta ? activePlanMeta.name : "Free Trial Athlete"}
                </h2>
                <Badge
                  tone={
                    currentTier === "lifetime" || currentTier === "monthly"
                      ? "volt"
                      : currentTier === "yearly"
                        ? "ember"
                        : "ghost"
                  }
                >
                  {currentTier === "free" ? "Free Limited" : "Active"}
                </Badge>
              </div>
              <p className="mt-1 text-[13px] text-fog">
                {currentTier === "lifetime"
                  ? "Lifetime VIP Founder status activated. You will never be billed again."
                  : currentTier === "yearly" && expiresAt
                    ? `Yearly Elite active · Renews on ${fmtDate(expiresAt)}`
                    : currentTier === "monthly" && expiresAt
                      ? `Monthly Pro active · Renews on ${fmtDate(expiresAt)}`
                      : "Upgrade today to unlock all 4 programs, unlimited workout sessions & advanced coach insights."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentTier !== "free" && (
              <button
                type="button"
                onClick={handleResetMembership}
                disabled={isResetting}
                title="Reset to Free Trial to test purchasing other plans"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-fog transition-all hover:border-volt/40 hover:text-paper hover:bg-white/[0.08] disabled:opacity-50"
              >
                <RotateCcw size={13} className={isResetting ? "animate-spin" : ""} />
                {isResetting ? "Resetting…" : "Reset to Free (Test Mode)"}
              </button>
            )}

            <a
              href="#plans"
              className="inline-flex items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-sm font-bold text-black transition-all hover:shadow-[0_0_24px_-4px_rgba(200,255,46,0.6)]"
            >
              <Sparkles size={16} /> {currentTier === "free" ? "Choose a Plan" : "Switch / Renew Plan"}
            </a>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div id="plans" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={cx(
                "panel relative flex flex-col justify-between overflow-hidden p-7 transition-all",
                plan.popular &&
                  "border-ember/50 shadow-[0_0_40px_-15px_rgba(255,122,41,0.25)]",
                plan.id === "lifetime" &&
                  "border-amber-400/40 shadow-[0_0_40px_-15px_rgba(255,215,0,0.25)]",
                isCurrent && "border-volt/60 bg-volt/[0.02]"
              )}
            >
              {/* Highlight badge */}
              {plan.badge && (
                <div
                  className="absolute top-4 right-4 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
                  style={{
                    background: `${plan.accent}22`,
                    color: plan.accent,
                    border: `1px solid ${plan.accent}55`,
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl tracking-wide uppercase">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full border border-volt/40 bg-volt/15 px-2 py-0.5 text-[10px] font-bold text-volt uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-fog">{plan.tagline}</p>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-1.5 border-b border-white/8 pb-6">
                  <span className="font-display text-5xl text-paper">
                    ₹{plan.price}
                  </span>
                  <span className="text-sm font-medium text-fog">
                    {plan.period}
                  </span>
                </div>

                <p className="mt-4 text-[13px] leading-relaxed text-fog">
                  {plan.description}
                </p>

                {/* Perks list */}
                <div className="mt-6 space-y-3">
                  <div className="text-[11px] font-bold tracking-wider text-fog uppercase">
                    What&apos;s included
                  </div>
                  {plan.perks.map((perk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-[13px] text-paper/90"
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: `${plan.accent}26`,
                          color: plan.accent,
                        }}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <Button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setCheckoutStep("details");
                    setUtrNumber("");
                  }}
                  variant={isCurrent ? "outline" : plan.popular ? "volt" : "outline"}
                  className={cx(
                    "w-full",
                    plan.id === "lifetime" && !isCurrent &&
                      "border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20",
                    isCurrent && "border-volt/40 text-volt hover:bg-volt/10"
                  )}
                >
                  {isCurrent ? (
                    <>
                      <Check size={16} /> Current Plan (Click to Renew ₹{plan.price})
                    </>
                  ) : plan.id === "lifetime" ? (
                    <>
                      <Crown size={16} /> Get Lifetime Access (₹{plan.price})
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Choose {plan.name} (₹{plan.price})
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Checkout Modal */}
      <Modal
        open={!!selectedPlan}
        onClose={() => !isProcessing && setSelectedPlan(null)}
        wide
      >
        {selectedPlan && (
          <div>
            {/* STEP: Verifying Spinner */}
            {checkoutStep === "verifying" && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-volt/40 bg-volt/10 text-volt">
                  <Loader2 className="animate-spin" size={36} />
                </div>
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  Authorizing Payment of ₹{selectedPlan.price}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-fog">
                  Verifying transaction with banking network and provisioning your {selectedPlan.name}…
                </p>
              </div>
            )}

            {/* STEP: Success */}
            {checkoutStep === "success" && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="font-display text-2xl tracking-wide text-emerald-400 uppercase">
                  Payment Approved!
                </h3>
                <p className="mt-2 text-sm text-fog">
                  Your {selectedPlan.name} is now active. Generating tax invoice…
                </p>
              </div>
            )}

            {/* STEP: UPI Collect App Approval */}
            {checkoutStep === "upi_pending" && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-volt/40 bg-volt/10 text-volt">
                  <Smartphone className="animate-bounce" size={32} />
                </div>
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  UPI Payment Request Sent
                </h3>
                <p className="mt-2 text-sm text-fog">
                  We have dispatched a collect request of <span className="font-bold text-volt">₹{selectedPlan.price} INR</span> to:
                </p>
                <div className="mx-auto mt-2 inline-block rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-sm font-semibold text-paper">
                  {upiId}
                </div>
                <p className="mt-4 text-xs text-fog">
                  Please open Google Pay, PhonePe, Paytm, or your banking app to approve the request within:
                </p>
                <div className="mt-2 font-display text-3xl text-volt">
                  {Math.floor(upiCountdown / 60)}:{String(upiCountdown % 60).padStart(2, "0")}
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCheckoutStep("details")}
                  >
                    Change Method
                  </Button>
                  <Button
                    type="button"
                    loading={isProcessing}
                    onClick={() => executeVerification(`UPI Collect (${upiId})`)}
                    className="px-8"
                  >
                    I Have Approved Payment
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: 3D Secure Card OTP */}
            {checkoutStep === "card_otp" && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-volt/40 bg-volt/10 text-volt">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  Bank 3D Secure Verification
                </h3>
                <p className="mt-2 text-sm text-fog">
                  A 6-digit one-time password (OTP) was sent to the mobile registered with card ending in <span className="font-bold text-paper">{cardNumber.replace(/\s+/g, "").slice(-4) || "4242"}</span>.
                </p>
                <div className="mt-1 text-xs text-fog">
                  Merchant: <span className="font-semibold text-paper">SixForge Fitness</span> · Amount: <span className="font-bold text-volt">₹{selectedPlan.price} INR</span>
                </div>

                <div className="mx-auto mt-6 max-w-xs text-left">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Enter 6-Digit Bank OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    className="h-12 w-full rounded-xl border border-volt/40 bg-white/[0.04] text-center font-mono text-2xl tracking-widest text-paper outline-none focus:border-volt"
                    placeholder="123456"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-fog">
                    <span>Simulated Test OTP: 123456</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpValue("123456");
                        toast.info("Test OTP 123456 filled");
                      }}
                      className="cursor-pointer text-volt hover:underline"
                    >
                      Fill Test OTP
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCheckoutStep("details")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    loading={isProcessing}
                    onClick={() => {
                      if (otpValue.length < 4) {
                        toast.error("Please enter the 6-digit OTP.");
                        return;
                      }
                      const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";
                      executeVerification(`Card (ending in ${last4}) - 3DS Verified`);
                    }}
                    className="px-8"
                  >
                    Authorize ₹{selectedPlan.price}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: Net Banking Gateway */}
            {checkoutStep === "bank_auth" && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-volt/40 bg-volt/10 text-volt">
                  <Building2 size={32} />
                </div>
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  {selectedBank} NetBanking Gateway
                </h3>
                <p className="mt-2 text-sm text-fog">
                  Ready to debit <span className="font-bold text-volt">₹{selectedPlan.price} INR</span> from your {selectedBank} account for {selectedPlan.name}.
                </p>

                <div className="mx-auto mt-6 max-w-sm rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs space-y-2 text-fog">
                  <div className="flex justify-between">
                    <span>Merchant</span>
                    <span className="font-semibold text-paper">SixForge Fitness Pvt Ltd</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer</span>
                    <span className="font-semibold text-paper">{username || "Alex Athlete"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Debit Amount</span>
                    <span className="font-bold text-volt">₹{selectedPlan.price}.00 INR</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCheckoutStep("details")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    loading={isProcessing}
                    onClick={() => executeVerification(`Net Banking (${selectedBank})`)}
                    className="px-8"
                  >
                    Confirm & Settle ₹{selectedPlan.price}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: Details Form */}
            {checkoutStep === "details" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background: `${selectedPlan.accent}20`,
                        color: selectedPlan.accent,
                      }}
                    >
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl tracking-wide uppercase">
                        Payment Checkout
                      </h3>
                      <p className="text-xs text-fog">
                        Select payment method to activate {selectedPlan.name}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-xs font-semibold text-volt">
                    ₹{selectedPlan.price} INR
                  </span>
                </div>

                {/* Order summary box */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-paper">
                      {selectedPlan.name} ({selectedPlan.period})
                    </span>
                    <span className="font-display text-xl text-volt">
                      ₹{selectedPlan.price}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-fog">
                    <span>GST (Goods & Services Tax)</span>
                    <span className="text-emerald-400">18% Included (₹0 extra)</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-white/8 pt-2.5 text-sm font-bold">
                    <span>Total Amount Payable</span>
                    <span className="font-display text-xl text-paper">₹{selectedPlan.price} INR</span>
                  </div>
                </div>

                {/* Payment Method Selector Tabs */}
                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Select Payment Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethodTab("upi")}
                      className={cx(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
                        paymentMethodTab === "upi"
                          ? "bg-volt text-black shadow-md"
                          : "text-fog hover:text-paper"
                      )}
                    >
                      <Smartphone size={14} /> UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethodTab("card")}
                      className={cx(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
                        paymentMethodTab === "card"
                          ? "bg-volt text-black shadow-md"
                          : "text-fog hover:text-paper"
                      )}
                    >
                      <CreditCard size={14} /> RuPay / Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethodTab("netbanking")}
                      className={cx(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
                        paymentMethodTab === "netbanking"
                          ? "bg-volt text-black shadow-md"
                          : "text-fog hover:text-paper"
                      )}
                    >
                      <Building2 size={14} /> Net Banking
                    </button>
                  </div>
                </div>

                <form onSubmit={handleInitiatePayment} className="mt-5 space-y-4">
                  {/* TAB 1: UPI */}
                  {paymentMethodTab === "upi" && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-fog uppercase">
                          Instant UPI Payment
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setUpiMode("qr")}
                            className={cx(
                              "cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                              upiMode === "qr"
                                ? "bg-volt text-black"
                                : "text-fog hover:text-paper"
                            )}
                          >
                            Scan UPI QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpiMode("id")}
                            className={cx(
                              "cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                              upiMode === "id"
                                ? "bg-volt text-black"
                                : "text-fog hover:text-paper"
                            )}
                          >
                            UPI ID / VPA
                          </button>
                        </div>
                      </div>

                      {upiMode === "qr" ? (
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                          <div className="relative mb-3 flex flex-col items-center justify-center rounded-2xl border border-volt/30 bg-white p-3 shadow-lg">
                            {upiQrDataUrl ? (
                              <img
                                src={upiQrDataUrl}
                                alt="UPI QR Code"
                                className="h-44 w-44 rounded-lg object-contain"
                              />
                            ) : (
                              <div className="flex h-44 w-44 items-center justify-center text-black">
                                <Loader2 className="animate-spin" size={32} />
                              </div>
                            )}
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-black uppercase">
                              Scan to pay ₹{selectedPlan.price} INR
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-fog">
                            <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-paper">GPay</span>
                            <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-paper">PhonePe</span>
                            <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-paper">Paytm</span>
                            <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-paper">BHIM</span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-fog">
                            <span>UPI ID: <strong className="text-paper">sixforge.fit@icici</strong></span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText("sixforge.fit@icici");
                                toast.success("UPI ID copied to clipboard!");
                              }}
                              className="cursor-pointer text-volt hover:underline inline-flex items-center gap-0.5"
                            >
                              <Copy size={11} /> Copy
                            </button>
                          </div>

                          {/* Step 2: UTR Reference verification */}
                          <div className="mt-4 w-full text-left rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-semibold tracking-wider text-volt uppercase">
                                Enter 12-Digit Bank UTR / Reference No.
                              </label>
                              <button
                                type="button"
                                onClick={handleFillTestUtr}
                                className="cursor-pointer text-[10px] text-volt hover:underline"
                              >
                                ⚡ Test UTR
                              </button>
                            </div>
                            <input
                              type="text"
                              maxLength={16}
                              value={utrNumber}
                              onChange={(e) => setUtrNumber(e.target.value.trim())}
                              className="h-10 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 font-mono text-sm text-paper outline-none focus:border-volt"
                              placeholder="e.g. 423891029482 (from your payment receipt)"
                            />
                            <p className="mt-1 text-[11px] text-fog">
                              After scanning and approving the payment on your phone, enter the 12-digit UTR to activate your plan.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold tracking-wider text-fog uppercase">
                              Enter UPI ID / VPA
                            </label>
                            <button
                              type="button"
                              onClick={handleFillTestUpi}
                              className="cursor-pointer text-[10px] text-volt hover:underline"
                            >
                              ⚡ Test UPI ID
                            </button>
                          </div>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                            placeholder="username@okhdfcbank or 9876543210@paytm"
                          />
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {["@okhdfcbank", "@oksbi", "@paytm", "@ybl", "@upi"].map((handle) => (
                              <button
                                key={handle}
                                type="button"
                                onClick={() => {
                                  const prefix = upiId.split("@")[0] || "athlete";
                                  setUpiId(`${prefix}${handle}`);
                                }}
                                className="cursor-pointer rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-fog transition-colors hover:border-volt/40 hover:text-volt"
                              >
                                {handle}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Card */}
                  {paymentMethodTab === "card" && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-fog uppercase">
                          Debit or Credit Card
                        </span>
                        <button
                          type="button"
                          onClick={handleFillTestCard}
                          className="cursor-pointer text-[11px] font-semibold text-volt hover:underline"
                        >
                          ⚡ Test Card
                        </button>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold tracking-wider text-fog uppercase">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                          placeholder="Name as printed on card"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold tracking-wider text-fog uppercase">
                          Card Number (RuPay, Visa, MasterCard)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm tracking-wider text-paper outline-none focus:border-volt/60"
                            placeholder="•••• •••• •••• ••••"
                          />
                          <span className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-fog uppercase">
                            RuPay / VISA
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold tracking-wider text-fog uppercase">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold tracking-wider text-fog uppercase">
                            CVV Code
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                            placeholder="•••"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Net Banking */}
                  {paymentMethodTab === "netbanking" && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <label className="block text-xs font-semibold tracking-wider text-fog uppercase">
                        Select Your Bank
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {[
                          "HDFC Bank",
                          "State Bank of India",
                          "ICICI Bank",
                          "Axis Bank",
                          "Kotak Bank",
                          "Punjab National Bank",
                        ].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={cx(
                              "cursor-pointer rounded-xl border p-3 text-left transition-all",
                              selectedBank === bank
                                ? "border-volt/60 bg-volt/10 text-paper font-semibold"
                                : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
                            )}
                          >
                            <Building2 size={16} className={selectedBank === bank ? "text-volt mb-1.5" : "text-fog mb-1.5"} />
                            <div className="text-xs">{bank}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 py-1 text-[12px] text-fog">
                    <Lock size={13} className="text-volt" />
                    <span>256-bit Bank Grade SSL Encryption · Verified Instant Activation</span>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedPlan(null)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" loading={isProcessing} className="px-8">
                      {paymentMethodTab === "upi" && upiMode === "qr"
                        ? `Verify UTR & Activate (₹${selectedPlan.price})`
                        : paymentMethodTab === "upi" && upiMode === "id"
                          ? `Send UPI Request (₹${selectedPlan.price})`
                          : paymentMethodTab === "card"
                            ? `Proceed to Card 3DS (₹${selectedPlan.price})`
                            : `Continue to ${selectedBank} (₹${selectedPlan.price})`}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment & Billing History */}
      {payments.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2.5">
            <Receipt size={18} className="text-volt" />
            <h3 className="font-display text-xl tracking-wide uppercase">
              Billing History & Receipts
            </h3>
          </div>
          <div className="panel overflow-hidden">
            <div className="divide-y divide-white/8">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm"
                >
                  <div>
                    <div className="font-semibold text-paper capitalize">
                      {p.tier} Plan Activation
                    </div>
                    <div className="text-xs text-fog">
                      {fmtDate(p.createdAt)} · {p.paymentMethod.replace("_", " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg text-volt">
                      ₹{p.amount} INR
                    </span>
                    <Badge tone="volt">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
