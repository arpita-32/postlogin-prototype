import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, CheckCircle2, AlertCircle, X, Copy, Check } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { CategoryId } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { PaymentSuccessModalHeader } from './PaymentSuccessModalHeader';

interface GenericCategoryFlowProps {
  categoryId: CategoryId;
  onBack: () => void;
  onPaymentSuccess?: (receipt: unknown) => void;
}

export const GenericCategoryFlow: React.FC<GenericCategoryFlowProps> = ({
  categoryId,
  onBack,
  onPaymentSuccess,
}) => {
  const categoryInfo = CATEGORIES.find((c) => c.id === categoryId) || {
    id: categoryId,
    title: categoryId.replace('-', ' ').toUpperCase(),
    iconName: 'HelpCircle',
  };

  // Sample Category Billers
  const getSampleBillers = () => {
    if (categoryId === 'water') {
      return [
        'City Municipal Council Ranebennur',
        'Delhi Jal Board (DJB)',
        'Bangalore Water Supply and Sewerage Board (BWSSB)',
        'Maharashtra Water Supply and Sewerage Board',
        'Chennai Metropolitan Water Supply and Sewerage Board',
      ];
    }
    if (categoryId === 'gas' || categoryId === 'lpg-gas') {
      return [
        'Indane Gas (Indian Oil)',
        'Bharat Gas (BPCL)',
        'HP Gas (HPCL)',
        'Gujarat Gas Limited',
        'Mahanagar Gas Limited (MGL)',
      ];
    }
    if (categoryId === 'fastag') {
      return [
        'Bank of Baroda FASTag',
        'ICICI Bank FASTag',
        'HDFC Bank FASTag',
        'Paytm Payments Bank FASTag',
        'Axis Bank FASTag',
      ];
    }
    return [
      `${categoryInfo.title} Provider 1 (BOB Partner)`,
      `${categoryInfo.title} Service Provider 2`,
      `National ${categoryInfo.title} Board`,
      `State ${categoryInfo.title} Corporation`,
    ];
  };

  const sampleBillers = getSampleBillers();

  // Screen State: 1 = Select Biller, 2 = Enter Details
  const [step, setStep] = useState<number>(1);
  const [selectedBillerName, setSelectedBillerName] = useState<string>('');
  const [authenticatorValue, setAuthenticatorValue] = useState<string>('000090982672');
  const [billerDropdownOpen, setBillerDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals
  const [showBillAmountModal, setShowBillAmountModal] = useState<boolean>(false);
  const [showConfirmPayModal, setShowConfirmPayModal] = useState<boolean>(false);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [showOtpToast, setShowOtpToast] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(59);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState<boolean>(false);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // OTP Timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  const handleCopyReceipt = async () => {
    const receiptText = `=== BBPS PAYMENT RECEIPT ===\nCategory: ${categoryInfo.title}\nTransaction Ref: BOB2026072691208\nBBPS Reference No: BBPS982019283012\nBiller Name: ${selectedBillerName || categoryInfo.title}\nConsumer / Account: ${authenticatorValue}\nPayment Type: ${paymentType.toUpperCase()}\nAmount Paid: ₹${getFinalAmount().toFixed(2)}\nStatus: Successful (Bharat Connect)`;
    await copyToClipboard(receiptText);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyText = async (text: string, fieldKey: string) => {
    await copyToClipboard(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Payment Timing Selection: 'early' | 'standard' | 'late'
  const [paymentType, setPaymentType] = useState<'early' | 'standard' | 'late'>(
    categoryId === 'water' ? 'late' : 'standard'
  );
  const baseBillAmount = categoryId === 'water' ? 3580.00 : 850.00;

  // Final amount math adjusted according to due date rules
  const getFinalAmount = () => {
    if (paymentType === 'early') return baseBillAmount - 50; // -50 discount for early payment
    if (paymentType === 'late') return baseBillAmount + 50;  // +50 fine for late payment
    return baseBillAmount; // standard bill amount on due date
  };

  const getSubHeadingText = () => {
    if (paymentType === 'early') return 'Early Bill Payment - ₹50.00 Discount Applied';
    if (paymentType === 'late') return 'Late Bill Payment - ₹50.00 Fee Applied';
    return 'Regular Bill Payment - Due Date: 2026-08-07';
  };

  const filteredBillers = sampleBillers.filter((b) =>
    b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBiller = (billerName: string) => {
    setSelectedBillerName(billerName);
    setBillerDropdownOpen(false);
    setStep(2);
    setErrorMsg('');
  };

  const handleFetchBill = () => {
    if (!authenticatorValue.trim()) {
      setErrorMsg('Please enter a valid Consumer / Account Number');
      return;
    }
    setErrorMsg('');
    setIsFetching(true);

    // Auto-determine Early Bill Payment vs Regular Bill Payment vs Late Bill Payment
    if (categoryId === 'water') {
      setPaymentType('late');
    } else {
      const today = new Date();
      const earlyPayDate = new Date('2026-07-27');
      const duePayDate = new Date('2026-08-07');

      if (today <= earlyPayDate || today < duePayDate) {
        setPaymentType('early');
      } else {
        setPaymentType('standard');
      }
    }

    setTimeout(() => {
      setIsFetching(false);
      setShowBillAmountModal(true);
    }, 600);
  };

  const handleProceedToConfirm = () => {
    setShowBillAmountModal(false);
    setShowConfirmPayModal(true);
  };

  const handleTriggerOtp = () => {
    setShowConfirmPayModal(false);
    setShowOtpModal(true);
    setShowOtpToast(true);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpTimer(59);
    setOtpError(null);
    setTimeout(() => setShowOtpToast(false), 4000);
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
      setShowOtpModal(false);
      setShowReceiptModal(true);
      if (onPaymentSuccess) {
        onPaymentSuccess({
          category: categoryInfo.title,
          biller: selectedBillerName,
          account: authenticatorValue,
          amount: getFinalAmount(),
          paymentType,
        });
      }
    }, 600);
  };

  const handleResendOtp = () => {
    if (otpTimer > 0) return;
    setOtpTimer(59);
    setShowOtpToast(true);
    setOtpError(null);
    setTimeout(() => setShowOtpToast(false), 4000);
  };

  return (
    <div className="p-6 bg-white min-h-[calc(100vh-4rem)] font-sans">
      {/* Header Back Navigation */}
      <div className="flex items-center space-x-3 mb-6 pb-2 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{categoryInfo.title}</h1>
      </div>

      {/* STEP 1: Select Biller */}
      {step === 1 && (
        <div className="max-w-xl space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select Biller</label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setBillerDropdownOpen(!billerDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded-md py-2.5 px-3.5 text-left text-sm flex items-center justify-between shadow-2xs hover:border-[#fc8036] focus:outline-none focus:ring-1 focus:ring-[#fc8036] cursor-pointer"
            >
              <span className={selectedBillerName ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {selectedBillerName || 'Select a Biller'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu with Search */}
            {billerDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col">
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

                <div className="overflow-y-auto divide-y divide-gray-100">
                  {filteredBillers.length > 0 ? (
                    filteredBillers.map((biller, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectBiller(biller)}
                        className="w-full text-left p-3 hover:bg-orange-50/60 flex items-center space-x-3 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                          {biller.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 leading-snug">
                          {biller}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No biller matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Enter Details (Matching Screenshots) */}
      {step === 2 && selectedBillerName && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Left Side */}
          <div className="lg:col-span-7 space-y-5">
            {/* Selected Biller Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Select Biller</label>
              <div
                onClick={() => {
                  setStep(1);
                  setBillerDropdownOpen(true);
                }}
                className="w-full bg-white border border-gray-300 hover:border-[#fc8036] rounded-md py-2 px-3 text-sm text-gray-900 flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <span className="font-medium">{selectedBillerName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Consumer / Account Number Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {categoryId === 'water' ? 'Consumer No' : 'Consumer / Account Number'}
              </label>
              <input
                type="text"
                placeholder="Enter Consumer No"
                value={authenticatorValue}
                onChange={(e) => {
                  setAuthenticatorValue(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs"
              />
              {errorMsg && (
                <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* Action Buttons: Fetch & Cancel */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleFetchBill}
                disabled={isFetching}
                className="bg-[#fc8036] hover:bg-orange-600 text-white font-medium text-sm py-2 px-8 rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center min-w-28"
              >
                {isFetching ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  'Fetch'
                )}
              </button>
              <button
                onClick={() => setStep(1)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 px-6 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Consent Box */}
            <div className="bg-orange-50/50 border border-orange-200 rounded-md p-3.5 text-xs text-gray-700 leading-relaxed mt-6">
              <span className="font-semibold text-gray-900">Note: </span>
              By proceeding, you consent to register this biller and authorize fetching of your current and future bills using the provided details. This consent can be withdrawn at any time by deleting the biller from My billers section.
            </div>
          </div>

          {/* Help Image Right Side (Exact replica of "WHERE TO FIND CONSUMER NO") */}
          <div className="lg:col-span-5 bg-[#E6F7FF]/60 border border-cyan-100 rounded-lg p-5 flex flex-col items-center">
            <h3 className="text-xs font-bold text-gray-700 tracking-wider uppercase mb-4 text-center">
              WHERE TO FIND CONSUMER NO
            </h3>

            {/* Sample Bill Mockup Container */}
            <div className="w-full bg-white border-2 border-gray-800 rounded-xs p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                <div className="w-8 h-8 rounded bg-orange-100 border border-orange-300 flex items-center justify-center font-black text-orange-700 text-xs shrink-0">
                  {selectedBillerName.charAt(0)}
                </div>
                <div className="text-xs font-bold text-gray-900 leading-tight truncate">
                  {selectedBillerName}
                </div>
              </div>

              <div className="text-center py-2 space-y-2">
                <div className="text-xs font-semibold text-gray-800">{categoryInfo.title} Bill</div>
                <div className="text-xs font-bold text-gray-900 bg-yellow-50 py-1.5 px-3 rounded inline-block border border-yellow-200">
                  Consumer No : {authenticatorValue || '000090982672'}
                </div>
              </div>

              <div className="text-right text-[10px] text-gray-500 italic pt-2 border-t border-gray-100">
                *Sample Details
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT 1: BILL AMOUNT MODAL */}
      {showBillAmountModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 relative max-h-[85vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <button
              onClick={() => setShowBillAmountModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pb-3">
              <h2 className="text-lg font-normal text-gray-800">Bill Amount</h2>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                ₹ {baseBillAmount.toFixed(2)}
              </div>
              <p className="text-xs font-semibold text-[#fc8036]">
                {getSubHeadingText()}
              </p>
              <p className="text-xs text-gray-500">
                This is the final amount to be paid,inclusive of all applicables taxes and fees.
              </p>
            </div>

            

            {/* Biller Logo & Name Block */}
            <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl p-3 my-2 flex items-center space-x-3">
              <div className="w-10 h-8 rounded bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-[#fc8036] shrink-0">
                {selectedBillerName.charAt(0)}
              </div>
              <span className="text-xs font-medium text-gray-800">{selectedBillerName}</span>
            </div>

            {/* Two Side-by-Side Cards (Matching Screenshot exactly) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs my-2">
              {/* Left Card */}
              <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Number:</span>
                  <span className="font-medium text-gray-900 font-mono">00003423473283</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Amount:</span>
                  <span className="font-medium text-gray-900 font-mono">{baseBillAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Due Date:</span>
                  <span className="font-medium text-gray-900 font-mono">2026-08-07</span>
                </div>
                <div
                  onClick={() => setPaymentType('standard')}
                  className={`flex justify-between items-center p-1 rounded transition-colors cursor-pointer ${
                    paymentType === 'standard' ? 'bg-orange-100/80 text-orange-900 font-bold border border-orange-300' : 'hover:bg-gray-200/50'
                  }`}
                  title="Click to select Due Date Bill Amount"
                >
                  <span className="text-gray-600 font-normal">Due Date Bill Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">₹ {baseBillAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Number:</span>
                  <span className="font-medium text-gray-900">NA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Name:</span>
                  <span className="font-medium text-gray-900 truncate max-w-[120px]" title="DIPAK N PALAN">DIPAK N PALAN</span>
                </div>
              </div>

              {/* Right Card */}
              <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Early Payment Date:</span>
                  <span className="font-medium text-gray-900 font-mono">2026-07-27</span>
                </div>
                <div
                  onClick={() => setPaymentType('early')}
                  className={`flex justify-between items-center p-1 rounded transition-colors cursor-pointer ${
                    paymentType === 'early' ? 'bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-300' : 'hover:bg-gray-200/50'
                  }`}
                  title="Click to select Early Payment Amount"
                >
                  <span className="text-gray-600 font-normal">Early Payment Amount:</span>
                  <span className="font-semibold text-emerald-700 font-mono">₹ {(baseBillAmount - 50).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Late Payment Date:</span>
                  <span className="font-medium text-gray-900 font-mono">2026-08-20</span>
                </div>
                <div
                  onClick={() => setPaymentType('late')}
                  className={`flex justify-between items-center p-1 rounded transition-colors cursor-pointer ${
                    paymentType === 'late' ? 'bg-rose-100/80 text-rose-900 font-bold border border-rose-300' : 'hover:bg-gray-200/50'
                  }`}
                  title="Click to select Late Payment Amount"
                >
                  <span className="text-gray-600 font-normal">Late Payment Amount:</span>
                  <span className="font-semibold text-rose-700 font-mono">₹ {(baseBillAmount + 50).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">PC:</span>
                  <span className="font-medium text-gray-900">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Disconn Tag:</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Month:</span>
                  <span className="font-medium text-gray-900">2607</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">DTC Code:</span>
                  <span className="font-medium text-gray-900 font-mono">3554147</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Type:</span>
                  <span className="font-medium text-gray-900">POSTPAID</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Buttons */}
            <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between space-x-3 w-full">
              <button
                type="button"
                onClick={() => setShowBillAmountModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2.5 px-4 rounded-md transition-colors cursor-pointer shadow-2xs text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 text-white font-medium text-sm py-2.5 px-4 rounded-md shadow-2xs transition-colors cursor-pointer text-center"
              >
                Confirm Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT 2: CONFIRM & PAY MODAL */}
      {showConfirmPayModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header: Back left, Close right */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                onClick={() => {
                  setShowConfirmPayModal(false);
                  setShowBillAmountModal(true);
                }}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>← Back</span>
              </button>
              <button
                onClick={() => setShowConfirmPayModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confirm & Pay Header & Subheading */}
            <div className="text-center pt-3 pb-2">
              <h2 className="text-lg font-normal text-gray-800">Confirm & Pay</h2>
              <p className="text-xs text-orange-600 font-semibold mt-0.5">
                {getSubHeadingText()}
              </p>
            </div>

            {/* Biller Logo & Name */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-lg p-3 my-2 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-[#fc8036]">
                {selectedBillerName.charAt(0)}
              </div>
              <span className="text-xs font-medium text-gray-800">{selectedBillerName}</span>
            </div>

            {/* Form Fields (Matching Screenshot 2 exactly) */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-gray-600 mb-1">When To Pay</label>
                <input
                  type="text"
                  readOnly
                  value={`Pay Now (${paymentType === 'early' ? 'Early Bill Payment' : paymentType === 'late' ? 'Late Bill Payment' : 'Regular Bill Payment'})`}
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Payment Amount (₹)</label>
                <input
                  type="text"
                  readOnly
                  value={getFinalAmount().toFixed(2)}
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Consumer Convenience Fee1 (CCF1)</label>
                <input
                  type="text"
                  readOnly
                  value="₹0.00"
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              {/* Red Total Amount Text */}
              <div className="text-red-500 text-xs font-medium py-1">
                Total Amount Inclusive of additional fee + GST - Rs. {getFinalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Consumer Convenience Fee (CCF)</label>
                <input
                  type="text"
                  readOnly
                  value="₹0"
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Payment Method *</label>
                <select className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-[#fc8036]">
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking / Savings Account">Net Banking / Savings Account</option>
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-5 flex justify-center">
              <button
                onClick={handleTriggerOtp}
                className="w-full bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm py-2.5 rounded-md shadow-2xs transition-colors cursor-pointer text-center"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP MODAL (Screenshot 5) */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Illustration Graphic */}
            <div className="flex justify-center my-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <rect x="45" y="20" width="70" height="120" rx="10" fill="#f97316" fillOpacity="0.9" />
                  <rect x="52" y="32" width="56" height="92" rx="4" fill="#ffffff" />
                  <circle cx="80" cy="132" r="3" fill="#ffffff" />
                  <circle cx="80" cy="26" r="1.5" fill="#fed7aa" />
                  <rect x="62" y="55" width="36" height="28" rx="4" fill="#ea580c" />
                  <path d="M72 55 V47 C72 42.5 88 42.5 88 47 V55" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="80" cy="67" r="3" fill="#ffffff" />
                  <path d="M80 70 V75" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
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

            {/* 6 Digit Input Boxes */}
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

            {/* Resend Countdown */}
            <div className="text-center mb-4">
              {otpTimer > 0 ? (
                <span className="text-xs font-semibold text-red-500">
                  Resend OTP in 0:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-[#fc8036] hover:underline cursor-pointer"
                >
                  Resend OTP Now
                </button>
              )}
            </div>

            {otpError && (
              <p className="text-xs text-center text-red-600 mb-3">{otpError}</p>
            )}

            {/* Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 rounded-md transition-colors cursor-pointer shadow-2xs text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isSubmittingOtp}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm py-2 rounded-md shadow-2xs transition-colors cursor-pointer text-center flex items-center justify-center space-x-2"
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

      {/* RECEIPT MODAL (Screenshot 6 Layout) */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
            {/* Header with Logos & Success message */}
            <PaymentSuccessModalHeader />

            {/* Biller Banner */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 my-2 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs border border-orange-200">
                {selectedBillerName ? selectedBillerName.charAt(0) : 'B'}
              </div>
              <span className="text-xs font-semibold text-gray-800">
                {selectedBillerName}
              </span>
            </div>

            {/* 2-Column Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{getFinalAmount().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Total Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{getFinalAmount().toFixed(2)}
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
                    Consumer / Account:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {authenticatorValue}
                  </span>
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
                  <span className="text-gray-600 font-normal">Biller Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Successful
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{getFinalAmount().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Bill due date:</span>
                  <span className="font-semibold text-gray-900 font-mono">2026-09-19</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Type:</span>
                  <span className="font-semibold text-orange-600 uppercase font-mono">
                    {paymentType}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Name:</span>
                  <span className="font-semibold text-gray-900">DIPAK N PALAN</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyReceipt}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-center space-x-2 shadow-2xs"
                id="copy-generic-receipt-btn"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Receipt Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-500" />
                    <span>Copy Receipt</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  onBack();
                }}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md text-xs cursor-pointer transition-colors shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericCategoryFlow;
