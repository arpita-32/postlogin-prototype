import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, CheckCircle2, AlertCircle, X, Copy, Check } from 'lucide-react';
import { ELECTRICITY_BILLERS } from '../data/mockData';
import { BillerOption } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface ElectricityFlowProps {
  onBack: () => void;
  onPaymentSuccess?: (receiptDetails: unknown) => void;
}

export const ElectricityFlow: React.FC<ElectricityFlowProps> = ({ onBack, onPaymentSuccess }) => {
  // Screen state: 1 = Select Biller, 2 = Enter Consumer Number
  const [step, setStep] = useState<number>(1);
  const [selectedBiller, setSelectedBiller] = useState<BillerOption | null>(null);
  const [consumerNumber, setConsumerNumber] = useState<string>('000090982672');
  const [billerDropdownOpen, setBillerDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals
  const [showBillAmountModal, setShowBillAmountModal] = useState<boolean>(false);
  const [showConfirmPayModal, setShowConfirmPayModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyReceipt = async () => {
    const receiptText = `=== BBPS PAYMENT RECEIPT ===\nTransaction Ref: BOB2026072691208\nBBPS Reference No: BBPS982019283012\nBiller Name: ${selectedBiller?.name || 'Electricity'}\nConsumer Number: ${consumerNumber}\nPayment Type: ${paymentType.toUpperCase()}\nAmount Paid: ₹${getFinalAmount().toFixed(2)}\nStatus: Successful (Bharat Connect)`;
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
  const [paymentType, setPaymentType] = useState<'early' | 'standard' | 'late'>('standard');
  const baseBillAmount = 3580.00;

  // Compute final amount adjusted according to due date rules
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

  // Filter billers
  const filteredBillers = ELECTRICITY_BILLERS.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBiller = (biller: BillerOption) => {
    setSelectedBiller(biller);
    setBillerDropdownOpen(false);
    setStep(2);
    setErrorMsg('');
  };

  const handleFetchBill = () => {
    if (!consumerNumber.trim()) {
      setErrorMsg('Please enter a valid Consumer Number');
      return;
    }
    setErrorMsg('');
    setIsFetching(true);

    // Auto-determine Early Bill Payment vs Regular Bill Payment based on current date relative to due date
    const today = new Date();
    const earlyPayDate = new Date('2026-07-27');
    const duePayDate = new Date('2026-08-07');

    if (today <= earlyPayDate || today < duePayDate) {
      setPaymentType('early');
    } else {
      setPaymentType('standard');
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

  const handleFinalPayment = () => {
    setShowConfirmPayModal(false);
    setShowReceiptModal(true);
    if (onPaymentSuccess) {
      onPaymentSuccess({
        biller: selectedBiller?.name,
        consumerNo: consumerNumber,
        amount: getFinalAmount(),
        paymentType,
      });
    }
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
        <h1 className="text-xl font-bold text-gray-800">Electricity</h1>
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
              <span className={selectedBiller ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {selectedBiller ? selectedBiller.name : 'Select a Biller'}
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
                    filteredBillers.map((biller) => (
                      <button
                        key={biller.id}
                        type="button"
                        onClick={() => handleSelectBiller(biller)}
                        className="w-full text-left p-3 hover:bg-orange-50/60 flex items-center space-x-3 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                          {biller.logo}
                        </div>
                        <span className="text-sm font-medium text-gray-800 leading-snug">
                          {biller.name}
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

      {/* STEP 2: Enter Consumer Number (Matching Screenshot 1 & 2) */}
      {step === 2 && selectedBiller && (
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
                <span className="font-medium">{selectedBiller.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Consumer Number Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Consumer No</label>
              <input
                type="text"
                placeholder={selectedBiller.authenticatorPlaceholder}
                value={consumerNumber}
                onChange={(e) => {
                  setConsumerNumber(e.target.value);
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
                  {selectedBiller.logo.substring(0, 4)}
                </div>
                <div className="text-xs font-bold text-gray-900 leading-tight truncate">
                  {selectedBiller.name}
                </div>
              </div>

              <div className="text-center py-2 space-y-2">
                <div className="text-xs font-semibold text-gray-800">Electricity Bill</div>
                <div className="text-xs font-bold text-gray-900 bg-yellow-50 py-1.5 px-3 rounded inline-block border border-yellow-200">
                  Consumer No : {consumerNumber || '000090982672'}
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

          

            {/* Biller Logo & Name Block (Matching Screenshot) */}
            <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl p-3 my-2 flex items-center space-x-3">
              <div className="w-10 h-8 rounded bg-white border border-gray-200 flex items-center justify-center p-1 shrink-0">
                <span className="font-bold text-[10px] text-[#fc8036] tracking-tighter">MAHA</span>
              </div>
              <span className="text-xs font-medium text-gray-800">{selectedBiller?.name || 'Maharashtra State Electricity Distbn Co Ltd'}</span>
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
                  <span className="font-medium text-gray-900 font-mono">3580.00</span>
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
                {selectedBiller?.logo.substring(0, 4)}
              </div>
              <span className="text-xs font-medium text-gray-800">{selectedBiller?.name}</span>
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
                onClick={handleFinalPayment}
                className="w-full bg-[#fc8036] hover:bg-orange-600 text-white font-semibold text-sm py-2.5 rounded-md shadow-2xs transition-colors cursor-pointer text-center"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Payment Successful!</h3>
              <p className="text-xs text-gray-500">Bharat Connect / BBPS Confirmation</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-xs font-mono border border-gray-200">
              <div className="flex items-center justify-between text-gray-600">
                <span>Transaction Ref:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-gray-900">BOB2026072691208</span>
                  <button
                    onClick={() => handleCopyText('BOB2026072691208', 'txn')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition-colors"
                    title="Copy Transaction Ref"
                  >
                    {copiedField === 'txn' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>BBPS Reference No:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-gray-900">BBPS982019283012</span>
                  <button
                    onClick={() => handleCopyText('BBPS982019283012', 'bbps')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition-colors"
                    title="Copy BBPS Reference"
                  >
                    {copiedField === 'bbps' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biller Name:</span>
                <span className="font-bold text-gray-900 truncate max-w-[180px]">{selectedBiller?.name}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Consumer Number:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-gray-900">{consumerNumber}</span>
                  <button
                    onClick={() => handleCopyText(consumerNumber, 'consumer')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition-colors"
                    title="Copy Consumer Number"
                  >
                    {copiedField === 'consumer' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Type:</span>
                <span className="font-bold uppercase text-orange-600">{paymentType}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-200 text-sm">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{getFinalAmount().toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyReceipt}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-center space-x-2"
                id="copy-receipt-btn"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Receipt Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-500" />
                    <span>Make a Copy / Copy Receipt</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  onBack();
                }}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-md text-xs cursor-pointer transition-colors"
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

export default ElectricityFlow;
