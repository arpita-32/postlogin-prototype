import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { PaymentSuccessModalHeader } from './PaymentSuccessModalHeader';

interface CreditLineUpiFlowProps {
  onBack: () => void;
  onPaymentSuccess?: (receipt: unknown) => void;
}

interface BillerItem {
  id: string;
  name: string;
  shortCode: string;
  billerId: string;
}

const CREDIT_LINE_BILLERS: BillerItem[] = [
  {
    id: 'yes-bank',
    name: 'Yes Bank CL-UPI',
    shortCode: 'YB',
    billerId: 'YESB00001CLUPI',
  },
  {
    id: 'test-hdfc',
    name: 'Test HDFC Bank Credit Line',
    shortCode: 'TH',
    billerId: 'TEST00028NAT6O',
  },
  {
    id: 'icici-cl',
    name: 'ICICI Bank Credit Line on UPI',
    shortCode: 'IC',
    billerId: 'ICIC00003CLUPI',
  },
  {
    id: 'sbi-cl',
    name: 'State Bank of India UPI Credit Line',
    shortCode: 'SB',
    billerId: 'SBIN00004CLUPI',
  },
  {
    id: 'axis-cl',
    name: 'Axis Bank Credit Line on UPI',
    shortCode: 'AX',
    billerId: 'UTIB00005CLUPI',
  },
];

type FlowModal = 'none' | 'payable-amount' | 'confirm-pay' | 'otp' | 'success';

export const CreditLineUpiFlow: React.FC<CreditLineUpiFlowProps> = ({
  onBack,
  onPaymentSuccess,
}) => {
  // Biller Selection state
  const [billerDropdownOpen, setBillerDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBiller, setSelectedBiller] = useState<BillerItem>(CREDIT_LINE_BILLERS[1]); // Default: Test HDFC Bank Credit Line

  // Form Details
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [last4Digits, setLast4Digits] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Modals & Flows
  const [activeModal, setActiveModal] = useState<FlowModal>('none');
  const [showOtpToast, setShowOtpToast] = useState<boolean>(false);

  // Payment Configuration
  const [paymentAmount, setPaymentAmount] = useState<string>('500');
  const [paymentMethod, setPaymentMethod] = useState<string>('Internet Banking/XXXXXXXXXX0976');

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(59);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Receipt Copy
  const [copied, setCopied] = useState<boolean>(false);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeModal === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeModal, otpTimer]);

  const filteredBillers = CREDIT_LINE_BILLERS.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBiller = (biller: BillerItem) => {
    setSelectedBiller(biller);
    setBillerDropdownOpen(false);
    setSearchQuery('');
    setFormError(null);
  };

  const handleFetchBill = () => {
    if (!selectedBiller) {
      setFormError('Please select a biller to proceed.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setFormError('Please enter a valid 10-digit registered mobile number.');
      return;
    }
    if (!last4Digits.trim() || last4Digits.length !== 4) {
      setFormError('Please enter the last 4 digits of your Credit Line number.');
      return;
    }
    // REQUIRED Checkbox validation
    if (!consentChecked) {
      setFormError('Please tick the consent checkbox to authorize fetching your Credit Line bill.');
      return;
    }

    setFormError(null);
    setIsFetching(true);

    setTimeout(() => {
      setIsFetching(false);
      setActiveModal('payable-amount');
    }, 500);
  };

  const handleProceedToConfirmPay = () => {
    setActiveModal('confirm-pay');
  };

  const handleTriggerOtp = () => {
    setActiveModal('otp');
    setShowOtpToast(true);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpTimer(59);
    setOtpError(null);
    setTimeout(() => {
      setShowOtpToast(false);
    }, 4000);
    // Focus first OTP box
    setTimeout(() => {
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus();
      }
    }, 150);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto move to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }
    setOtpError(null);
    setIsSubmittingOtp(true);

    setTimeout(() => {
      setIsSubmittingOtp(false);
      setActiveModal('success');
      if (onPaymentSuccess) {
        onPaymentSuccess({
          category: 'Credit Line On Upi Repayment',
          biller: selectedBiller.name,
          mobile: mobileNumber,
          amount: parseFloat(paymentAmount) || 500,
          txnId: 'BB116237145698e7e3fc',
        });
      }
    }, 700);
  };

  const handleResendOtp = () => {
    if (otpTimer > 0) return;
    setOtpTimer(59);
    setShowOtpToast(true);
    setOtpError(null);
    setTimeout(() => setShowOtpToast(false), 4000);
  };

  const handleCopyReceiptText = async () => {
    const text = `=== BHARAT CONNECT / BOB PAYMENT RECEIPT ===
Category: Credit Line On Upi Repayment
Biller: ${selectedBiller.name}
Amount Paid: ₹${parseFloat(paymentAmount).toFixed(2)}
Payment Status: Successful
Payment Channel: Internet Banking
Payment Method: ${paymentMethod}
B-Connect Txn ID: BB116237145698e7e3fc
Transaction Ref No: 1706087940497408
Source Ref Number: 284627090
Registered Mobile: ${mobileNumber}
Credit Line Last 4: ${last4Digits}
Customer Name: Srinadh
Bill Due Date: 2026-09-19`;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 md:p-8 bg-white min-h-[calc(100vh-5rem)] font-sans relative">
      {/* Toast Notification (Screenshot 5 top right) */}
      {showOtpToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#16a34a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-3 fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>OTP Sent Successfully</span>
        </div>
      )}

      {/* Header Back Navigation (Screenshot 1 & 2) */}
      <div className="flex items-center space-x-3 mb-6 pb-2 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          title="Go Back"
          id="credit-line-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-800 font-display">
            Credit Line On Upi Repayment
          </h1>
          <span className="bg-[#fc8036] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
            NEW
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout (Matching Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-6xl">
        {/* Left Form Area */}
        <div className="lg:col-span-7 space-y-4">
          {/* Select Biller Field with Popover (Screenshot 1 & 2) */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Biller
            </label>

            <button
              type="button"
              onClick={() => setBillerDropdownOpen(!billerDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded-md py-2.5 px-3.5 text-left text-sm flex items-center justify-between shadow-2xs hover:border-[#fc8036] focus:outline-none focus:ring-1 focus:ring-[#fc8036] cursor-pointer"
              id="credit-line-biller-select"
            >
              <span className="font-medium text-gray-900">
                {selectedBiller.name}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu matching Screenshot 1 */}
            {billerDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="p-2 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type to search biller"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#fc8036]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Select a Biller
                </div>

                <div className="overflow-y-auto divide-y divide-gray-100">
                  {filteredBillers.map((biller) => (
                    <button
                      key={biller.id}
                      type="button"
                      onClick={() => handleSelectBiller(biller)}
                      className="w-full text-left p-3 hover:bg-orange-50/70 flex items-center space-x-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200 group-hover:bg-[#fc8036] group-hover:text-white transition-colors">
                        {biller.shortCode}
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                        {biller.name}
                      </span>
                    </button>
                  ))}
                  {filteredBillers.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No biller matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Registered Mobile Number Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Registered Mobile Number
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="e.g. 8000394875"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value.replace(/\D/g, ''));
                setFormError(null);
              }}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs"
              id="credit-line-mobile-input"
            />
          </div>

          {/* Last 4 digits of Credit Line Number Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Last 4 digits of Credit Line Number
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 4875"
              value={last4Digits}
              onChange={(e) => {
                setLast4Digits(e.target.value.replace(/\D/g, ''));
                setFormError(null);
              }}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs font-mono"
              id="credit-line-last4-input"
            />
          </div>

          {/* Mandatory Checkbox (Requested by User) */}
          <div
            className={`p-3 rounded-lg border transition-all ${
              !consentChecked && formError?.includes('checkbox')
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-200'
                : 'bg-gray-50/70 border-gray-200 hover:border-gray-300'
            }`}
          >
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (formError) setFormError(null);
                }}
                className="w-4 h-4 text-[#fc8036] accent-[#fc8036] rounded border-gray-300 focus:ring-[#fc8036] cursor-pointer shrink-0"
                id="credit-line-consent-checkbox"
              />
              <span className="text-xs font-medium text-gray-700 leading-snug">
                Consent to fetch the bill using the details entered above.
              </span>
            </label>
          </div>

          {/* Validation Error Message */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action Buttons: Fetch & Cancel (Screenshot 2) */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleFetchBill}
              disabled={isFetching}
              className="bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-medium text-sm py-2 px-8 rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center min-w-28"
              id="credit-line-fetch-btn"
            >
              {isFetching ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                'Fetch'
              )}
            </button>
            <button
              onClick={onBack}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 px-6 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          </div>

          {/* Orange-outlined Note Box (Screenshot 2) */}
          <div className="border border-[#fc8036] rounded-lg p-3.5 text-xs text-gray-700 leading-relaxed mt-6 bg-white shadow-2xs">
            <span className="font-semibold text-gray-900">Note: </span>
            By proceeding, you consent to register this biller and authorize fetching of your current and future bills using the provided details. This consent can be withdrawn at any time by deleting the biller from My billers section.
          </div>
        </div>

        {/* Right Info Area (Screenshot 2: WHERE TO FIND REGISTERED MOBILE NUMBER) */}
        <div className="lg:col-span-5 p-6 bg-gray-50/40 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-xs font-bold text-gray-700 tracking-wider uppercase">
            WHERE TO FIND REGISTERED MOBILE NUMBER
          </h3>
          <p className="text-sm font-semibold text-rose-600">
            Biller bill image not available
          </p>
          <div className="p-4 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 space-y-2">
            <div className="font-semibold text-gray-800">Quick Guide:</div>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>Enter the mobile number linked with your UPI Credit Line / Bank account.</li>
              <li>Provide the last 4 digits printed on your credit line / virtual card portal.</li>
              <li>Tick the confirmation box before clicking <b>Fetch</b>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PAYABLE AMOUNT (Screenshot 3)                                    */}
      {/* ========================================================================= */}
      {activeModal === 'payable-amount' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setActiveModal('none')}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Content */}
            <div className="text-center space-y-1 pb-3">
              <h2 className="text-lg font-medium text-gray-800">Payable Amount</h2>
              <div className="text-2xl font-bold text-gray-900">₹ 500</div>
              <p className="text-xs text-gray-500">
                This is the final amount to be paid, inclusive of all applicable taxes and fees.
              </p>
            </div>

            {/* Biller Badge */}
            <div className="bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 my-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                {selectedBiller.shortCode}
              </div>
              <span className="text-xs font-semibold text-gray-800">
                {selectedBiller.name}
              </span>
            </div>

            {/* 2-Column Info Grid matching Screenshot 3 exactly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-3 bg-[#f8f9fa] p-4 rounded-xl border border-gray-100">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Number:</span>
                  <span className="font-semibold text-gray-900 font-mono">BIL2106210614S043</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">500.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Due Date:</span>
                  <span className="font-semibold text-gray-900 font-mono">2026-09-19</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Number:</span>
                  <span className="font-semibold text-gray-900">NA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Name:</span>
                  <span className="font-semibold text-gray-900">Srinadh</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Minimum Amount Due:</span>
                  <span className="font-semibold text-gray-900 font-mono">100.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Total Amount Due:</span>
                  <span className="font-semibold text-gray-900 font-mono">500.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Total Outstanding Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">600.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Sanctioned Limit:</span>
                  <span className="font-semibold text-gray-900 font-mono">1000.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Available Limit:</span>
                  <span className="font-semibold text-gray-900 font-mono">500.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Utilized Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">500.00</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-xs py-2 px-5 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirmPay}
                className="bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-medium text-xs py-2 px-6 rounded-md shadow-2xs transition-colors cursor-pointer"
                id="credit-line-proceed-confirm-btn"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM & PAY (Screenshot 4)                                     */}
      {/* ========================================================================= */}
      {activeModal === 'confirm-pay' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header: Back on left, Close on right */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <button
                onClick={() => setActiveModal('payable-amount')}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>← Back</span>
              </button>
              <button
                onClick={() => setActiveModal('none')}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Centered Heading */}
            <div className="text-center pt-3 pb-2">
              <h2 className="text-lg font-bold text-gray-800">Confirm & Pay</h2>
              <p className="text-xs text-gray-500 mt-0.5">Are you sure to Pay?</p>
            </div>

            {/* Biller Logo & Name */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 my-2 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs border border-orange-200">
                {selectedBiller.shortCode}
              </div>
              <span className="text-xs font-semibold text-gray-800">
                {selectedBiller.name}
              </span>
            </div>

            {/* Form Fields matching Screenshot 4 */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-gray-600 mb-1">When To Pay</label>
                <input
                  type="text"
                  readOnly
                  value="Pay Now"
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Payment Amount (₹)</label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 font-mono focus:outline-none focus:border-[#fc8036]"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Consumer Convenience Fee1 (CCF1)
                </label>
                <input
                  type="text"
                  readOnly
                  value="₹0.00"
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              {/* Red Total Amount Text */}
              <div className="text-red-500 text-xs font-medium py-0.5">
                Total Amount Inclusive of additional fee + GST - Rs. {parseFloat(paymentAmount || '0').toFixed(2)}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Consumer Convenience Fee (CCF)
                </label>
                <input
                  type="text"
                  readOnly
                  value="₹0"
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-semibold">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-[#fc8036]"
                >
                  <option value="Internet Banking/XXXXXXXXXX0976">
                    Internet Banking/XXXXXXXXXX0976
                  </option>
                  <option value="Bank of Baroda Savings A/C - 0976">
                    Bank of Baroda Savings A/C - 0976
                  </option>
                  <option value="UPI / VPA (Instant)">UPI / VPA (Instant)</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>
            </div>

            {/* Orange Action CTA Button */}
            <div className="pt-5">
              <button
                onClick={handleTriggerOtp}
                className="w-full bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm py-2.5 rounded-md shadow-2xs transition-colors cursor-pointer text-center"
                id="credit-line-confirm-pay-btn"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OTP VERIFICATION (Screenshot 5)                                  */}
      {/* ========================================================================= */}
      {activeModal === 'otp' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setActiveModal('none')}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Illustration Graphic (Screenshot 5) */}
            <div className="flex justify-center my-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Phone / OTP Shield Graphic */}
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <rect x="45" y="20" width="70" height="120" rx="10" fill="#f97316" fillOpacity="0.9" />
                  <rect x="52" y="32" width="56" height="92" rx="4" fill="#ffffff" />
                  <circle cx="80" cy="132" r="3" fill="#ffffff" />
                  <circle cx="80" cy="26" r="1.5" fill="#fed7aa" />
                  {/* Lock badge */}
                  <rect x="62" y="55" width="36" height="28" rx="4" fill="#ea580c" />
                  <path d="M72 55 V47 C72 42.5 88 42.5 88 47 V55" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="80" cy="67" r="3" fill="#ffffff" />
                  <path d="M80 70 V75" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  {/* Decorative SMS / Flower elements */}
                  <circle cx="125" cy="85" r="8" fill="#fdba74" />
                  <circle cx="125" cy="85" r="4" fill="#ea580c" />
                  <rect x="25" y="70" width="18" height="12" rx="2" fill="#fed7aa" />
                </svg>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-gray-900">OTP Verification</h2>
              <p className="text-xs text-gray-500">
                OTP has been sent via SMS to XXXXXXX264
              </p>
            </div>

            {/* 6 Digit Input Boxes (Screenshot 5) */}
            <div className="flex justify-center space-x-2 my-5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className={`w-10 h-12 text-center text-lg font-bold border rounded-md focus:outline-none transition-colors ${
                    digit
                      ? 'border-[#fc8036] text-gray-900 bg-orange-50/20'
                      : 'border-gray-300 text-gray-900 focus:border-[#fc8036] focus:ring-1 focus:ring-[#fc8036]'
                  }`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Resend Countdown in Red */}
            <div className="text-center mb-4">
              {otpTimer > 0 ? (
                <span className="text-xs font-semibold text-red-500">
                  Resend OTP in 0:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-[#fc8036] hover:underline flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend OTP Now</span>
                </button>
              )}
            </div>

            {/* OTP Error */}
            {otpError && (
              <p className="text-xs text-center text-red-600 mb-3">{otpError}</p>
            )}

            {/* Buttons: Cancel & Submit (Screenshot 5) */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 rounded-md transition-colors cursor-pointer shadow-2xs text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isSubmittingOtp}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm py-2 rounded-md shadow-2xs transition-colors cursor-pointer text-center flex items-center justify-center space-x-2"
                id="credit-line-submit-otp-btn"
              >
                {isSubmittingOtp ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BILL PAYMENT SUCCESSFUL (Screenshot 6)                          */}
      {/* ========================================================================= */}
      {activeModal === 'success' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Logos & Success message */}
            <PaymentSuccessModalHeader />

            {/* Biller Logo & Name */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 my-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs border border-orange-200">
                {selectedBiller.shortCode}
              </div>
              <span className="text-xs font-semibold text-gray-800">
                {selectedBiller.name}
              </span>
            </div>

            {/* 2-Column Summary Receipt (Matching Screenshot 6 exactly) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{parseFloat(paymentAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Total Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{parseFloat(paymentAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">
                    Consumer Convenience Fee (CCF):
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">₹0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Source Ref Number:</span>
                  <span className="font-semibold text-gray-900 font-mono">284627090</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">B-Connect Txn ID:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    BB116237145698e7e3fc
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">
                    Transaction Reference Number:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    1706087940497408
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">
                    Transaction Date & Time:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    25-08-2026 14:56:05
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">
                    Registered Mobile Number:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {mobileNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">
                    Last 4 digits of Credit Line Number:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {last4Digits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Name:</span>
                  <span className="font-semibold text-gray-900">Srinadh</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Successful
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Channel:</span>
                  <span className="font-semibold text-gray-900">Internet Banking</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Method:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[140px]" title={paymentMethod}>
                    {paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Biller Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Successful
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{parseFloat(paymentAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill due date:</span>
                  <span className="font-semibold text-gray-900 font-mono">2026-09-19</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill date:</span>
                  <span className="font-semibold text-gray-900 font-mono">2026-08-17</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Biller ID:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {selectedBiller.billerId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">
                    Approval Reference Number:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    615416987654
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payee Mobile No.:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    917008501264
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyReceiptText}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs py-2 px-4 rounded-md flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500" />
                      <span>Copy Details</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs py-2 px-4 rounded-md flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Download Receipt</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setActiveModal('none');
                    setConsentChecked(false);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-xs py-2 px-5 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  Pay Another
                </button>
                <button
                  onClick={onBack}
                  className="bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-medium text-xs py-2 px-6 rounded-md shadow-2xs transition-colors cursor-pointer"
                  id="credit-line-done-btn"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
