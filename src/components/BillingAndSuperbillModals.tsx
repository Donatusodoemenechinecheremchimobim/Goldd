import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  X,
  Lock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { InvoiceRecord } from '../types';

interface PrePaymentConsentModalProps {
  invoice: InvoiceRecord | null;
  patientEmail?: string;
  onClose: () => void;
  onPaymentSuccess: (updatedInvoice: InvoiceRecord) => void;
}

export const PrePaymentConsentModal: React.FC<PrePaymentConsentModalProps> = ({
  invoice,
  patientEmail,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<
    | 'Stripe Credit / Debit Card'
    | 'HSA / FSA Health Savings Card'
    | 'Apple Pay / Google Pay Wallet'
  >('Stripe Credit / Debit Card');
  const [cardholderName, setCardholderName] = useState(invoice?.patientName || '');
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [consentItemizedChecked, setConsentItemizedChecked] = useState(false);
  const [consentCancellationChecked, setConsentCancellationChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!invoice) return null;

  const cptCode = invoice.cptCode || '99214';
  const totalAmount = Number(invoice.amount || 0);
  const insuranceCovered = Number(invoice.insuranceCoveredAmount || 0);
  const patientDue = Number(invoice.patientResponsibility || 0);

  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!consentItemizedChecked || !consentCancellationChecked) {
      setErrorMsg(
        'Please check both the Informed Financial Consent and the Late Cancellation / Refund Policy attestation boxes before authorizing payment.'
      );
      return;
    }

    setSubmitting(true);
    const consentTimestamp = new Date().toISOString();
    const cleanLast4 = cardLastFour.replace(/\D/g, '').slice(-4);
    const methodLabel = cleanLast4
      ? `${selectedMethod} (ending in ${cleanLast4})`
      : selectedMethod;

    try {
      // 1. Request Stripe Checkout Session or Tokenized Confirmation from Ubuntu Server
      const sessionRes = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
          patientEmail: patientEmail || invoice.patientEmail || '',
          amount: patientDue,
          paymentMethod: methodLabel,
          clientOrigin: window.location.origin,
        }),
      });
      const sessionData = await sessionRes.json();

      // If live Stripe Checkout URL is returned, save pending consent and redirect to Stripe
      if (sessionData?.ok && sessionData.mode === 'stripe_redirect' && sessionData.checkoutUrl) {
        window.sessionStorage.setItem(
          `gmp_pending_invoice_${invoice.id}`,
          JSON.stringify({
            ...invoice,
            paymentMethod: methodLabel,
            financialConsentAcceptedAt: consentTimestamp,
          })
        );
        window.location.href = sessionData.checkoutUrl;
        return;
      }

      // 2. Complete & verify payment against Ubuntu PostgreSQL (`goldenmind_db`) + dispatch SMTP receipt
      const verifyRes = await fetch('/api/billing/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
          patientEmail: patientEmail || invoice.patientEmail || '',
          description: invoice.description,
          cptCode,
          serviceDate: invoice.serviceDate,
          amount: totalAmount,
          insuranceCoveredAmount: insuranceCovered,
          patientResponsibility: patientDue,
          paymentMethod: methodLabel,
          financialConsentAcceptedAt: consentTimestamp,
          transactionId: sessionData?.transactionId,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData?.ok) {
        setErrorMsg(verifyData?.error || 'Payment could not be verified. Please try again.');
        setSubmitting(false);
        return;
      }

      onPaymentSuccess(verifyData.invoice as InvoiceRecord);
    } catch {
      setErrorMsg('Unable to reach the payment server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-portal-body">
      <div className="bg-white border border-stone-200 rounded-[28px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9E7206]">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>HIPAA · Federal No Surprises Act · PCI-DSS Compliant Checkout</span>
            </div>
            <h3 className="text-xl font-bold font-portal-heading text-stone-900 mt-1">
              Itemized Statement Review &amp; Good Faith Estimate
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Please review the exact clinical service, CPT procedure code, and fee breakdown below
              before authorizing payment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Itemized CPT & Fee Breakdown Box */}
        <div className="p-5 rounded-[20px] bg-[#FAF9F5] border border-[#D4AF37]/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E7206]">
                Itemized Clinical Procedure &amp; Service
              </span>
              <p className="text-sm font-bold text-stone-900 mt-0.5">
                CPT {cptCode} · {invoice.description}
              </p>
            </div>
            <span className="text-xs text-stone-600 font-portal-heading tabular-nums">
              Service Date: <strong>{invoice.serviceDate}</strong>
            </span>
          </div>

          <div className="space-y-2 text-xs font-portal-heading tabular-nums">
            <div className="flex items-center justify-between text-stone-600">
              <span>Rendering Clinician:</span>
              <span className="font-semibold text-stone-900">
                Brenda Hobyani, MSN, APRN, PMHNP-BC (Texas Telehealth POS 02/10)
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Standard Practice Charge (CPT {cptCode}):</span>
              <span className="font-semibold text-stone-900">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700">
              <span>Insurance Plan Coverage / Contracted Adjustment:</span>
              <span className="font-semibold">-${insuranceCovered.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-stone-200 text-sm font-bold text-stone-900">
              <span>Your Confirmed Co-Pay / Self-Pay Responsibility:</span>
              <span className="text-lg text-[#9E7206]">${patientDue.toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* 2. Federal No Surprises Act & HIPAA Minimum-Necessary Discreet Billing Notice */}
        <div className="p-4 rounded-[16px] bg-stone-50 border border-stone-200 space-y-2 text-[11px] text-stone-600 leading-relaxed">
          <p>
            <strong className="text-stone-900">
              Federal No Surprises Act Good Faith Estimate (45 C.F.R. § 149.610):
            </strong>{' '}
            You have the right to receive this itemized Good Faith Estimate explaining the exact
            cost of your psychiatric care prior to payment. If you are billed $400 or more above
            your Good Faith Estimate, you have the federal right to dispute the charge at
            www.cms.gov/nosurprises or 1-800-985-3059.
          </p>
          <p>
            <strong className="text-stone-900">
              HIPAA Bank &amp; Card Statement Privacy (45 C.F.R. § 164.502(b)):
            </strong>{' '}
            To protect your medical privacy, your credit card, HSA/FSA, or bank statement will only
            display <strong>GOLDEN MIND PSYCH</strong> and will never reveal psychiatric diagnoses
            or clinical details to your bank.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 3. Payment Method & Consent Form */}
        <form onSubmit={handleAuthorizePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">
              Select Payment Method (PCI-DSS Encrypted)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'Stripe Credit / Debit Card',
                    label: 'Credit / Debit Card',
                    sub: 'Visa, Mastercard, Amex',
                  },
                  {
                    id: 'HSA / FSA Health Savings Card',
                    label: 'HSA / FSA Medical Card',
                    sub: 'IRS Sec. 213(d) Eligible',
                  },
                  {
                    id: 'Apple Pay / Google Pay Wallet',
                    label: 'Apple Pay / Google Pay',
                    sub: '1-Click Digital Wallet',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMethod(opt.id)}
                  className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer ${
                    selectedMethod === opt.id
                      ? 'bg-[#FAF6EA] border-[#D4AF37] text-stone-900 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    <CreditCard className="w-3.5 h-3.5 text-[#9E7206]" />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cardholder / HSA Verification Details (Only last 4 digits used for receipt audit) */}
          <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#9E7206]" />
                <span>{selectedMethod} Authorization Details</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700">
                256-Bit TLS · Raw Card Never Stored on Server
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Name on Card / Account *
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Full Name on Card"
                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Card Last 4 Digits *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={cardLastFour}
                  onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4242"
                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs font-portal-heading tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Exp (MM/YY)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="08/28"
                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs font-portal-heading tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Billing ZIP *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={cardZip}
                  onChange={(e) => setCardZip(e.target.value)}
                  placeholder="79701"
                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs font-portal-heading tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Informed Financial & Cancellation Checkboxes */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consentItemizedChecked}
                onChange={(e) => setConsentItemizedChecked(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-[#9E7206] focus:ring-[#D4AF37]"
              />
              <span>
                <strong>Informed Financial Consent (Texas HB 300 &amp; No Surprises Act):</strong> I
                confirm that I have reviewed the itemized service description (
                <strong>
                  CPT {cptCode} · {invoice.description}
                </strong>
                ), standard charge (<strong>${totalAmount.toFixed(2)}</strong>), insurance
                adjustment (<strong>-${insuranceCovered.toFixed(2)}</strong>), and I authorize Golden
                Mind Psychiatry PLLC to charge <strong>${patientDue.toFixed(2)}</strong> to my
                selected payment method.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consentCancellationChecked}
                onChange={(e) => setConsentCancellationChecked(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-[#9E7206] focus:ring-[#D4AF37]"
              />
              <span>
                <strong>24-Hour Cancellation, No-Show &amp; Refund Policy:</strong> I understand
                that appointments canceled with at least 24 hours' notice or any billing
                overpayments are eligible for a full refund or account credit through my Client
                Portal.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[12px] border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !consentItemizedChecked || !consentCancellationChecked}
              className="px-6 py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs sm:text-sm inline-flex items-center gap-2 hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Processing Encrypted Payment...'
                  : `Authorize & Pay $${patientDue.toFixed(2)} USD`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PrintableSuperbillModalProps {
  invoice: InvoiceRecord | null;
  patientEmail?: string;
  patientDob?: string;
  patientInsurance?: string;
  patientMemberId?: string;
  onClose: () => void;
}

export const PrintableSuperbillModal: React.FC<PrintableSuperbillModalProps> = ({
  invoice,
  patientEmail,
  patientDob,
  patientInsurance,
  patientMemberId,
  onClose,
}) => {
  if (!invoice) return null;

  const cptCode = invoice.cptCode || '99214';
  const totalAmount = Number(invoice.amount || 0);
  const insuranceCovered = Number(invoice.insuranceCoveredAmount || 0);
  const patientDue = Number(invoice.patientResponsibility || 0);
  const txId = invoice.transactionId || `GMP-${invoice.id.slice(-8).toUpperCase()}`;

  const handleDownloadSuperbillTxt = () => {
    const lines = [
      '========================================================================',
      'GOLDEN MIND PSYCHIATRY PLLC — OFFICIAL MEDICAL SUPERBILL & RECEIPT',
      'Where Every Mind Is Golden · 100% Telehealth Across Texas',
      'Rendering Provider: Brenda Hobyani, MSN, APRN, PMHNP-BC',
      'Phone: (432) 300-6667 · Email: info@goldenmindpsychiatry.org',
      'Place of Service: POS 02 / POS 10 (HIPAA Encrypted Telehealth)',
      '========================================================================',
      `Receipt / Transaction ID:   ${txId}`,
      `Statement ID:               ${invoice.id}`,
      `Statement Status:           ${invoice.status.toUpperCase()}`,
      `Patient Name:               ${invoice.patientName}`,
      `Patient DOB:                ${patientDob || 'On File'}`,
      `Patient Email:              ${patientEmail || invoice.patientEmail || 'On File'}`,
      `Primary Insurance:          ${patientInsurance || 'Self-Pay / Out-of-Network Superbill'}${
        patientMemberId ? ` (Member ID: ${patientMemberId})` : ''
      }`,
      '------------------------------------------------------------------------',
      'ITEMIZED CLINICAL PROCEDURE & FINANCIAL BREAKDOWN',
      '------------------------------------------------------------------------',
      `Date of Service:            ${invoice.serviceDate}`,
      `CPT Procedure Code:         CPT ${cptCode}`,
      `Service Description:        ${invoice.description}`,
      `Standard Clinical Charge:   $${totalAmount.toFixed(2)} USD`,
      `Insurance Plan Adjustment:  -$${insuranceCovered.toFixed(2)} USD`,
      `Patient Co-Pay / Balance:   $${patientDue.toFixed(2)} USD`,
      `Payment Method:             ${invoice.paymentMethod || 'Stripe Card / HSA-FSA'}`,
      `Date Paid:                  ${invoice.paidAt || 'Pending'}`,
      `Informed Consent Signed At: ${invoice.financialConsentAcceptedAt || invoice.paidAt || 'Verified'}`,
      ...(invoice.status === 'refunded'
        ? [
            `Refunded Amount:            $${Number(invoice.refundAmount ?? patientDue).toFixed(2)} USD`,
            `Refund Date:                ${invoice.refundedAt || ''}`,
            `Refund Reason:              ${invoice.refundReason || 'Provider Adjustment'}`,
          ]
        : []),
      '========================================================================',
      'NOTICE FOR INSURANCE REIMBURSEMENT:',
      'Patients submitting this Superbill for out-of-network insurance',
      'reimbursement or HSA/FSA substantiation (IRS Sec. 213(d)) may attach',
      'this document directly to their health plan claim form.',
      '========================================================================',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GoldenMind_Superbill_${invoice.patientName.replace(/\s+/g, '_')}_${invoice.serviceDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-portal-body">
      <div className="bg-white border border-stone-200 rounded-[28px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9E7206]">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>Official Medical Superbill &amp; IRS HSA/FSA Receipt</span>
            </div>
            <h3 className="text-xl font-bold font-portal-heading text-stone-900 mt-1">
              Golden Mind Psychiatry PLLC — Statement #{txId}
            </h3>
            <p className="text-xs text-stone-500">
              Brenda Hobyani, MSN, APRN, PMHNP-BC · Texas Telehealth (POS 02/10) · (432) 300-6667
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient & Provider Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[16px] bg-[#FAF9F5] border border-stone-200 text-xs">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Patient Information
            </p>
            <p className="font-bold text-stone-900 text-sm">{invoice.patientName}</p>
            {patientDob && <p className="text-stone-600">DOB: {patientDob}</p>}
            <p className="text-stone-600">
              Insurance: {patientInsurance || 'Self-Pay / Out-of-Network'}
              {patientMemberId ? ` (#${patientMemberId})` : ''}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Rendering Provider &amp; Facility
            </p>
            <p className="font-bold text-stone-900 text-sm">
              Brenda Hobyani, MSN, APRN, PMHNP-BC
            </p>
            <p className="text-stone-600">Golden Mind Psychiatry PLLC · State of Texas</p>
            <p className="text-stone-600">Phone: (432) 300-6667 · info@goldenmindpsychiatry.org</p>
          </div>
        </div>

        {/* Itemized Procedure Table */}
        <div className="border border-stone-200 rounded-[16px] overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-[11px] font-bold uppercase text-stone-600">
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">CPT Code</th>
                <th className="py-3 px-4">Clinical Procedure Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-portal-heading tabular-nums">
              <tr>
                <td className="py-3.5 px-4 text-stone-700">{invoice.serviceDate}</td>
                <td className="py-3.5 px-4 font-bold text-[#9E7206]">CPT {cptCode}</td>
                <td className="py-3.5 px-4 font-sans text-stone-900 font-semibold">
                  {invoice.description}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                  ${totalAmount.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-stone-50/70">
                <td colSpan={3} className="py-2.5 px-4 text-right font-sans text-stone-600">
                  Insurance Plan Coverage / Contracted Adjustment:
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                  -${insuranceCovered.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-[#FAF6EA]">
                <td
                  colSpan={3}
                  className="py-3 px-4 text-right font-sans font-bold text-stone-900 text-sm"
                >
                  {invoice.status === 'paid'
                    ? 'Total Paid by Patient:'
                    : invoice.status === 'refunded'
                    ? 'Refunded Amount:'
                    : 'Net Patient Responsibility:'}
                </td>
                <td className="py-3 px-4 text-right font-bold text-base text-stone-900">
                  $
                  {invoice.status === 'refunded'
                    ? Number(invoice.refundAmount ?? patientDue).toFixed(2)
                    : patientDue.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Audit Trail Metadata */}
        <div className="p-4 rounded-[14px] bg-stone-50 border border-stone-200 space-y-1.5 text-xs text-stone-600 font-portal-heading tabular-nums">
          <p>
            <strong>Payment Status:</strong>{' '}
            <span className="uppercase font-bold text-stone-900">{invoice.status}</span> ·{' '}
            <strong>Transaction ID:</strong> {txId}
          </p>
          {invoice.paymentMethod && (
            <p>
              <strong>Payment Method:</strong> {invoice.paymentMethod}
            </p>
          )}
          {invoice.paidAt && (
            <p>
              <strong>Paid Timestamp:</strong> {new Date(invoice.paidAt).toLocaleString()}
            </p>
          )}
          {invoice.financialConsentAcceptedAt && (
            <p>
              <strong>Informed Financial &amp; GFE Consent Signed:</strong>{' '}
              {new Date(invoice.financialConsentAcceptedAt).toLocaleString()}
            </p>
          )}
          {invoice.status === 'refunded' && (
            <p className="text-amber-800">
              <strong>Refund Processed:</strong> $
              {Number(invoice.refundAmount ?? patientDue).toFixed(2)} on{' '}
              {invoice.refundedAt ? new Date(invoice.refundedAt).toLocaleDateString() : 'Recorded'}{' '}
              ({invoice.refundReason || 'Provider Adjustment'})
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={handleDownloadSuperbillTxt}
            className="px-4 py-2.5 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Superbill (.TXT)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save Official PDF Superbill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
