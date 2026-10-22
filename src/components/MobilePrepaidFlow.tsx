import React, { useState } from 'react';
import { ArrowLeft, X, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface MobilePrepaidFlowProps {
  onBack: () => void;
  onPaymentSuccess?: (receipt: unknown) => void;
}

interface PlanItem {
  id: string;
  price: string;
  validity: string;
  talktime: string;
  description: string;
  category: 'Recharge' | 'Voice' | 'TOPUP' | 'Data plan';
}

const SAMPLE_PLANS: PlanItem[] = [
  {
    id: '1',
    price: '109.0',
    validity: 'N/A',
    talktime: '0',
    description:
      '34 Local min free Local Onnet Mobile Free 26 STD min free STD Onnet Mobile Free 34 Local SMS free 26 National SMS free Local Onnet SMS Free National Onnet SMS Free 30 Local & STD Video min free 110 MB Free Data Data Validity 10 days',
    category: 'Recharge',
  },
  {
    id: '2',
    price: '1097.0',
    validity: 'N/A',
    talktime: '0',
    description:
      'Unlimited any network voice calls LocalSTD in home nw and MTNL Mumbai nw. Free 40 GB 3G Data. 1000 SMS LocalSTD in home nw and MTNL Mumbai nw Applicable for Validity Extension Migration & New connection only',
    category: 'Recharge',
  },
  {
    id: '3',
    price: '11.0',
    validity: 'N/A',
    talktime: '0',
    description: '50 Local min free',
    category: 'Recharge',
  },
  {
    id: '4',
    price: '14.0',
    validity: 'N/A',
    talktime: '0',
    description:
      'Plan conversionLocal Own 1p2Sec Local Other 1p1Sec STD 1p1Sec; RoamingMTMOInCircleMOOutCircleFree80p115p per Min',
    category: 'Recharge',
  },
  {
    id: '5',
    price: '99.0',
    validity: '28 days',
    talktime: '99',
    description: 'Full Talktime Pack with 200MB Data',
    category: 'TOPUP',
  },
  {
    id: '6',
    price: '299.0',
    validity: '28 days',
    talktime: '0',
    description: 'Unlimited Voice Calls + 1.5GB/day + 100 SMS/day',
    category: 'Voice',
  },
  {
    id: '7',
    price: '719.0',
    validity: '84 days',
    talktime: '0',
    description: 'Unlimited Voice Calls + 1.5GB/day + 100 SMS/day',
    category: 'Voice',
  },
  {
    id: '8',
    price: '19.0',
    validity: 'Active Plan',
    talktime: '0',
    description: '1 GB Data Top Up Pack',
    category: 'Data plan',
  },
];

export const MobilePrepaidFlow: React.FC<MobilePrepaidFlowProps> = ({ onBack, onPaymentSuccess }) => {
  const [biller, setBiller] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('9876543212');
  const [circle, setCircle] = useState<string>('Delhi');
  const [amount, setAmount] = useState<string>('109');
  
  // Plans Modal state
  const [isPlansModalOpen, setIsPlansModalOpen] = useState<boolean>(false);
  const [activePlanTab, setActivePlanTab] = useState<'Recharge' | 'Voice' | 'TOPUP' | 'Data plan'>('Recharge');

  // Success state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyReceipt = async () => {
    const text = `=== BBPS PREPAID RECHARGE RECEIPT ===\nOperator: ${biller || 'Mobile Operator'}\nMobile Number: ${mobileNumber}\nCircle: ${circle}\nAmount: ₹${amount}\nTransaction Ref: BOB${Date.now().toString().slice(-10)}\nStatus: Successful`;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPlans = SAMPLE_PLANS.filter((p) => p.category === activePlanTab);

  const handleSelectPlan = (plan: PlanItem) => {
    // Strip trailing .0 if integer
    const numPrice = parseFloat(plan.price).toString();
    setAmount(numPrice);
    setIsPlansModalOpen(false);
  };

  const handleFetchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessModal(true);
    if (onPaymentSuccess) {
      onPaymentSuccess({
        biller,
        mobileNumber,
        circle,
        amount,
        date: new Date().toLocaleDateString('en-IN'),
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen">
      {/* Top Title Bar */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-800"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-normal text-gray-900 tracking-tight">Mobile Prepaid</h1>
      </div>

      {/* Main Form + Right Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Section */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleFetchSubmit} className="space-y-4">
            {/* Select Biller */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">Select Biller</label>
              <select
                value={biller}
                onChange={(e) => setBiller(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs"
              >
                <option value="" disabled hidden>Select a Biller</option>
                <option value="MTNL">MTNL</option>
                <option value="Airtel Prepaid">Airtel Prepaid</option>
                <option value="Jio Prepaid">Jio Prepaid</option>
                <option value="Vodafone Idea (Vi)">Vodafone Idea (Vi)</option>
                <option value="BSNL Prepaid">BSNL Prepaid</option>
              </select>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs"
              />
            </div>

            {/* Circle */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">Circle</label>
              <input
                type="text"
                required
                value={circle}
                onChange={(e) => setCircle(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-1">Amount</label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#fc8036] focus:border-[#fc8036] shadow-2xs"
              />
            </div>

            {/* Browse Plans Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(true)}
                className="bg-[#fc8036] hover:bg-orange-600 text-white font-normal text-sm py-2 px-5 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                Browse Plans
              </button>
            </div>

            {/* Action Buttons: Fetch & Cancel */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <button
                type="submit"
                className="bg-[#fc8036] hover:bg-orange-600 text-white font-normal text-sm py-2 px-10 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                Fetch
              </button>
              <button
                type="button"
                onClick={onBack}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-normal text-sm py-2 px-8 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Bottom Note Box */}
          <div className="border border-orange-200 bg-orange-50/30 rounded-md p-3 mt-6">
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-medium">Note:</span> By proceeding, you consent to register this biller and authorize fetching of your current and future bills using the provided details. This consent can be withdrawn at any time by deleting the biller from My billers section.
            </p>
          </div>
        </div>

      </div>

      {/* RECHARGE PLAN MODAL */}
      {isPlansModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Recharge Plan</h2>
              <button
                onClick={() => setIsPlansModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader: Biller Logo Left & Bharat Connect Logo Right */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-5 border border-gray-300 rounded bg-gray-50 flex items-center justify-center text-[9px] font-bold text-gray-600">
                  {biller.substring(0, 4)}
                </div>
                <span className="font-bold text-sm text-gray-800">{biller}</span>
              </div>

              {/* Bharat Connect Logo */}
              <div className="flex items-center">
                <img
                  src="/bharat_connect.png"
                  alt="Bharat Connect"
                  className="h-8 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Plan Category Tabs */}
            <div className="flex space-x-8 border-b border-gray-200 pt-3 px-2">
              {(['Recharge', 'Voice', 'TOPUP', 'Data plan'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivePlanTab(tab)}
                  className={`pb-2 text-sm font-medium transition-colors cursor-pointer relative ${
                    activePlanTab === tab
                      ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Plan Table */}
            <div className="overflow-y-auto flex-1 mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-800 bg-white sticky top-0">
                    <th className="py-3 px-4 w-28">Price</th>
                    <th className="py-3 px-4 w-28">Validity</th>
                    <th className="py-3 px-4 w-24">Talktime</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => (
                      <tr
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan)}
                        className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4 font-bold text-sm text-gray-900 group-hover:text-[#fc8036]">
                          {plan.price}
                        </td>
                        <td className="py-4 px-4 text-gray-700 font-medium">
                          {plan.validity}
                        </td>
                        <td className="py-4 px-4 text-gray-700 font-medium">
                          {plan.talktime}
                        </td>
                        <td className="py-4 px-4 text-gray-600 leading-relaxed">
                          {plan.description}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        No plans found for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-800">Recharge Request Sent!</h3>
            <p className="text-xs text-gray-600">
              Fetched bill & recharge request for <span className="font-semibold text-gray-800">{mobileNumber}</span> ({biller}) of <span className="font-bold text-gray-900">₹{amount}</span>.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-center space-x-1.5"
                id="copy-prepaid-receipt-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Make a Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-md text-xs cursor-pointer"
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

export default MobilePrepaidFlow;
