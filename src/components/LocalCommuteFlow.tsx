import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Clock,
  MapPin,
  Train,
  Bus,
  ShieldCheck,
  CreditCard,
  Building,
  Wallet,
  X,
  QrCode
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { PaymentSuccessModalHeader } from './PaymentSuccessModalHeader';

interface LocalCommuteFlowProps {
  onBack: () => void;
}

interface RouteOption {
  id: string;
  name: string;
  linesTitle: string;
  totalFare: number;
  durationMinutes: number;
  legs: {
    from: string;
    to: string;
    lineName: string;
    colorClass: string;
    dotColor: string;
    fare: number;
    duration: number;
  }[];
}

const MUMBAI_STATIONS = [
  'DADAR',
  'POISAR',
  'ANDHERI',
  'DN NAGAR',
  'GUNDAVALI',
  'BANDRA',
  'BORIVALI',
  'GHATKOPAR',
  'VERSOVA',
  'BKC (BANDRA KURLA COMPLEX)',
  'CUFFE PARADE',
  'DAHISAR',
  'MALAD',
  'KANDIVALI',
];

const STATE_CITY_MAP: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Nariman Point', 'Mumbai Suburban', 'Bandra', 'Worli', 'Pune', 'Nagpur', 'Thane', 'Navi Mumbai'],
  'Delhi NCR': ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Gandhinagar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'Telangana': ['Hyderabad', 'Warangal', 'Secunderabad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
};

const TRANSPORT_MODES = [
  'All Modes (Metro, Bus & Suburban)',
  'Metro Rail',
  'City Bus',
  'Suburban Railway (Local Train)',
  'Monorail',
];

export const LocalCommuteFlow: React.FC<LocalCommuteFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState<
    'journey-details' | 'route-options' | 'summary' | 'ticket'
  >('journey-details');

  // Form State (unpopulated by default)
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mode, setMode] = useState<string>('All Modes (Metro, Bus & Suburban)');
  const [source, setSource] = useState<string>('DADAR');
  const [destination, setDestination] = useState<string>('POISAR');
  const [travellers, setTravellers] = useState<number>(1);
  const [journeyType, setJourneyType] = useState<'Single' | 'Return'>('Single');

  // Selected Route
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-1');

  // Payment Confirmation & Method
  const [paymentMethod, setPaymentMethod] = useState<string>('Select Payment Account');
  const [showConfirmPayModal, setShowConfirmPayModal] = useState<boolean>(false);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [showOtpToast, setShowOtpToast] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(59);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Available Route Options based on selection
  const routeOptions: RouteOption[] = [
    {
      id: 'route-1',
      name: 'Route 1',
      linesTitle: 'Aqua + Red Line',
      totalFare: 50,
      durationMinutes: 28,
      legs: [
        {
          from: source === 'DADAR' ? 'Dadar' : source,
          to: 'DN Nagar',
          lineName: 'Aqua Line',
          colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
          dotColor: 'bg-[#fc8036]',
          fare: 30,
          duration: 15,
        },
        {
          from: 'DN Nagar',
          to: destination === 'POISAR' ? 'Poisar' : destination,
          lineName: 'Red Line',
          colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
          dotColor: 'bg-amber-600',
          fare: 20,
          duration: 13,
        },
      ],
    },
    {
      id: 'route-2',
      name: 'Route 2',
      linesTitle: 'Yellow + Red Line',
      totalFare: 55,
      durationMinutes: 34,
      legs: [
        {
          from: source === 'DADAR' ? 'Dadar' : source,
          to: 'Gundavali',
          lineName: 'Yellow Line',
          colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
          dotColor: 'bg-amber-500',
          fare: 35,
          duration: 18,
        },
        {
          from: 'Gundavali',
          to: destination === 'POISAR' ? 'Poisar' : destination,
          lineName: 'Red Line',
          colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
          dotColor: 'bg-[#fc8036]',
          fare: 20,
          duration: 16,
        },
      ],
    },
  ];

  const chosenRoute = routeOptions.find((r) => r.id === selectedRouteId) || routeOptions[0];
  const unitFare = journeyType === 'Return' ? chosenRoute.totalFare * 1.8 : chosenRoute.totalFare;
  const calculatedFare = Math.round(unitFare * travellers);
  const convenienceFee = 0;
  const grandTotal = calculatedFare + convenienceFee;

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

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
    }, 600);
  };

  const handleResendOtp = () => {
    if (otpTimer > 0) return;
    setOtpTimer(59);
    setShowOtpToast(true);
    setOtpError(null);
    setTimeout(() => setShowOtpToast(false), 4000);
  };

  // Valid till dynamic time calculation (2 hours from now)
  const getExpiryTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Copy Ticket Summary
  const handleCopyTicket = async () => {
    const summary = `=== MUMBAI METRO DIGITAL AFC PASS ===\nStatus: VALID FOR 2 HOURS\nService: Mumbai Metro (${chosenRoute.linesTitle})\nRoute: ${source} -> ${destination}\nTravellers: ${travellers} Adult(s)\nJourney Type: ${journeyType} Journey\nFare Paid: ₹${grandTotal}.00\nBooking Ref: BCTR2026051724893\nValid Till: ${getExpiryTime()}`;
    await copyToClipboard(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyField = async (text: string, fieldKey: string) => {
    await copyToClipboard(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 bg-white min-h-[calc(100vh-5rem)] font-sans relative">
      {/* Toast Alert when OTP is sent */}
      {showOtpToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>OTP has been sent to your registered mobile number (Ending in 264).</span>
        </div>
      )}

      {/* Header Back Navigation */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (step === 'journey-details') onBack();
              else if (step === 'route-options') setStep('journey-details');
              else if (step === 'summary') setStep('route-options');
              else if (step === 'ticket') onBack();
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
            title="Go Back"
            id="commute-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 font-display">
            Local Commute
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: Journey Details Form (No Sequence Bar, No Recent Trips)           */}
        {/* ========================================================================= */}
        {step === 'journey-details' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-800 font-display">Journey Details</h2>
                <span className="bg-[#fc8036] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                  NEW
                </span>
              </div>
              <p className="text-xs text-gray-500">Configure origin, destination & transit preferences</p>
            </div>

            {/* State and City Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => {
                      const selectedState = e.target.value;
                      setState(selectedState);
                      setCity('');
                      setValidationError(null);
                    }}
                    className={`w-full appearance-none bg-white border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors cursor-pointer ${
                      state
                        ? 'border-[#fc8036] text-gray-800'
                        : 'border-gray-300 text-gray-500 focus:border-[#fc8036]'
                    }`}
                  >
                    <option value="">-- Select State --</option>
                    {Object.keys(STATE_CITY_MAP).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <div className="relative">
                  <select
                    value={city}
                    disabled={!state}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setValidationError(null);
                    }}
                    className={`w-full appearance-none bg-white border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors cursor-pointer ${
                      !state
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : city
                        ? 'border-[#fc8036] text-gray-800'
                        : 'border-gray-300 text-gray-500 focus:border-[#fc8036]'
                    }`}
                  >
                    <option value="">-- Select City --</option>
                    {state &&
                      STATE_CITY_MAP[state]?.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Mode of Transit Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Mode of Transit
              </label>
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#fc8036] transition-colors cursor-pointer"
                >
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* From & To Station Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Origin Station
                </label>
                <div className="relative">
                  <select
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#fc8036] transition-colors cursor-pointer"
                  >
                    {MUMBAI_STATIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Destination Station
                </label>
                <div className="relative">
                  <select
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#fc8036] transition-colors cursor-pointer"
                  >
                    {MUMBAI_STATIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Travellers and Journey Type (Orange theme) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Travellers counter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Passengers
                </label>
                <div className="flex items-center justify-between border border-gray-300 rounded-xl p-2 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-800 pl-2">
                    {travellers} Adult{travellers > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={travellers <= 1}
                      onClick={() => setTravellers((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-orange-50 hover:border-[#fc8036] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      disabled={travellers >= 6}
                      onClick={() => setTravellers((prev) => Math.min(6, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-orange-50 hover:border-[#fc8036] disabled:opacity-40 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Journey Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Journey Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJourneyType('Single')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      journeyType === 'Single'
                        ? 'bg-[#fc8036] text-white border-[#fc8036] shadow-xs'
                        : 'bg-white hover:bg-orange-50/40 text-gray-700 border-gray-200'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setJourneyType('Return')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      journeyType === 'Return'
                        ? 'bg-[#fc8036] text-white border-[#fc8036] shadow-xs'
                        : 'bg-white hover:bg-orange-50/40 text-gray-700 border-gray-200'
                    }`}
                  >
                    Return (Save 10%)
                  </button>
                </div>
              </div>
            </div>

            {/* Validation alert */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold animate-in fade-in">
                {validationError}
              </div>
            )}

            {/* CTA Button (Orange theme) */}
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  if (!state) {
                    setValidationError('Please select a State to proceed.');
                    return;
                  }
                  if (!city) {
                    setValidationError('Please select a City to proceed.');
                    return;
                  }
                  if (source === destination) {
                    setValidationError('Origin station and Destination station cannot be the same.');
                    return;
                  }
                  setValidationError(null);
                  setStep('route-options');
                }}
                className="w-full bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                id="commute-find-routes-btn"
              >
                <span>Find Routes & Fares →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Route Options Selection (Orange Selection Theme)                 */}
        {/* ========================================================================= */}
        {step === 'route-options' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 font-display">Select Your Route</h2>
              <p className="text-xs text-gray-500">
                {source} → {destination} • {travellers} Traveller{travellers > 1 ? 's' : ''} ({journeyType})
              </p>
            </div>

            {/* Route Cards */}
            <div className="space-y-4">
              {routeOptions.map((opt) => {
                const isSelected = selectedRouteId === opt.id;
                const optionFare = journeyType === 'Return' ? Math.round(opt.totalFare * 1.8 * travellers) : opt.totalFare * travellers;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedRouteId(opt.id)}
                    className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#fc8036] bg-orange-50/20 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-gray-900">{opt.name}:</span>
                          <span className="font-semibold text-sm text-gray-800">{opt.linesTitle}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{opt.durationMinutes} mins</span>
                          </span>
                          <span>•</span>
                          <span>{opt.legs.length - 1} interchange</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-gray-900 font-mono">
                          ₹ {optionFare}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Total Fare</span>
                      </div>
                    </div>

                    {/* Legs visual */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      {opt.legs.map((leg, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${leg.dotColor}`} />
                            <span className="text-gray-700">
                              {leg.from} → {leg.to} ({leg.lineName})
                            </span>
                          </div>
                          <span className="text-gray-500 font-medium">{leg.duration} mins</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions (Orange theme) */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setStep('journey-details')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setStep('summary');
                }}
                className="px-8 py-3 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
                id="commute-confirm-route-btn"
              >
                Review Details (₹{grandTotal}) →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Booking Summary / Review Details                                  */}
        {/* ========================================================================= */}
        {step === 'summary' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800 font-display">Journey Summary</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Please review your travel and transit details before payment
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 text-[#fc8036] px-3.5 py-1 rounded-full text-xs font-bold">
                {journeyType} Journey
              </div>
            </div>

            {/* Main Journey Details Card */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-[#fc8036] flex items-center justify-center font-bold text-base border border-orange-200">
                    🚇
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {source} → {destination}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {city || 'Mumbai'}, {state || 'Maharashtra'} • {mode}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-500 block">Estimated Time</span>
                  <span className="text-sm font-bold text-gray-900 font-mono">
                    {chosenRoute.durationMinutes} mins
                  </span>
                </div>
              </div>

              {/* Grid of Key Properties */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Selected Route</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{chosenRoute.name}</span>
                  <span className="text-[11px] text-gray-500">{chosenRoute.linesTitle}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Passengers</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{travellers} Adult{travellers > 1 ? 's' : ''}</span>
                  <span className="text-[11px] text-gray-500">Standard Pass</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Journey Type</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{journeyType}</span>
                  <span className="text-[11px] text-gray-500">{journeyType === 'Return' ? 'Round Trip' : 'One Way'}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Validity</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">2 Hours</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">From Entry Tap</span>
                </div>
              </div>

              {/* Route Segments Breakdown */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-700 block">Route Segments & Interchanges</span>
                <div className="space-y-2 pt-1">
                  {chosenRoute.legs.map((leg, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${leg.dotColor}`} />
                        <span className="font-semibold text-gray-800">
                          {leg.from} → {leg.to}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {leg.lineName}
                        </span>
                      </div>
                      <span className="text-gray-500 font-mono">{leg.duration} mins</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown Table */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block text-xs">Fare Breakdown</span>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between py-1.5 text-gray-600">
                    <span>Base Fare per passenger</span>
                    <span className="font-mono text-gray-900">₹ {chosenRoute.totalFare}.00</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-gray-600">
                    <span>Passengers</span>
                    <span className="font-mono text-gray-900">× {travellers}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-gray-600">
                    <span>Journey Type</span>
                    <span className="font-mono text-gray-900">{journeyType === 'Return' ? 'Return (2x)' : 'Single (1x)'}</span>
                  </div>
                  <div className="flex justify-between pt-2.5 pb-1 text-sm font-bold text-gray-900">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-base text-[#fc8036]">₹ {grandTotal}.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions (Orange theme) */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setStep('route-options')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Modify Route
              </button>
              <button
                onClick={() => {
                  setShowConfirmPayModal(true);
                }}
                className="px-8 py-3.5 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center space-x-2"
                id="commute-summary-confirm-pay-btn"
              >
                <span>Confirm & Pay (₹{grandTotal}) →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: Final Digital Metro Ticket QR Screen                              */}
        {/* ========================================================================= */}
        {step === 'ticket' && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden space-y-6">
            {/* Header Title */}
            <div className="bg-[#fc8036] text-white p-5 text-center space-y-1">
              <h3 className="font-bold text-base">
                Mumbai Metro • {journeyType} Journey Pass
              </h3>
              <p className="text-xs text-orange-100 font-semibold">
                {source} → {destination}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Validity Badge */}
              <div className="flex justify-center">
                <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>VALID FOR 2 HOURS</span>
                </span>
              </div>

              {/* QR Card */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md flex flex-col items-center">
                  {/* SVG QR Code */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="5" y="5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="12" y="12" width="12" height="12" fill="currentColor" />
                      <rect x="69" y="5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="76" y="12" width="12" height="12" fill="currentColor" />
                      <rect x="5" y="69" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="12" y="76" width="12" height="12" fill="currentColor" />
                      <rect x="36" y="8" width="5" height="5" />
                      <rect x="45" y="12" width="5" height="5" />
                      <rect x="55" y="8" width="5" height="5" />
                      <rect x="36" y="24" width="5" height="5" />
                      <rect x="48" y="22" width="5" height="5" />
                      <rect x="58" y="24" width="5" height="5" />
                      <rect x="8" y="38" width="5" height="5" />
                      <rect x="18" y="44" width="5" height="5" />
                      <rect x="26" y="38" width="5" height="5" />
                      <rect x="8" y="54" width="5" height="5" />
                      <rect x="22" y="56" width="5" height="5" />
                      <rect x="72" y="38" width="5" height="5" />
                      <rect x="84" y="44" width="5" height="5" />
                      <rect x="72" y="54" width="5" height="5" />
                      <rect x="86" y="56" width="5" height="5" />
                      <rect x="36" y="72" width="5" height="5" />
                      <rect x="48" y="78" width="5" height="5" />
                      <rect x="58" y="72" width="5" height="5" />
                      <rect x="36" y="86" width="5" height="5" />
                      <rect x="48" y="88" width="5" height="5" />
                      <rect x="58" y="86" width="5" height="5" />
                    </svg>

                    {/* Center Icon Badge */}
                    <div className="absolute w-8 h-8 rounded bg-[#fc8036] text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
                      🚇
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Metadata Breakdown */}
              <div className="space-y-2.5 text-xs divide-y divide-gray-100">
                <div className="flex justify-between pt-1 text-gray-700">
                  <span className="text-gray-500">Route</span>
                  <span className="font-bold text-gray-900">{chosenRoute.linesTitle}</span>
                </div>
                <div className="flex justify-between pt-2 text-gray-700">
                  <span className="text-gray-500">From → To</span>
                  <span className="font-bold text-gray-900">
                    {source} → {destination}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-gray-700">
                  <span className="text-gray-500">Valid Till</span>
                  <span className="font-bold text-gray-900 font-mono">{getExpiryTime()}</span>
                </div>
                <div className="flex justify-between pt-2 text-gray-700">
                  <span className="text-gray-500">Fare Paid</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-[#fc8036] text-sm">₹ {grandTotal}.00</span>
                    <button
                      onClick={() => handleCopyField(`₹ ${grandTotal}.00`, 'fare')}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      title="Copy Fare"
                    >
                      {copiedField === 'fare' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleCopyTicket}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Pass Details Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500" />
                      <span>Make a Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onBack}
                  className="w-full bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md transition-all cursor-pointer"
                  id="commute-back-to-home-btn"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRM & PAY MODAL (Matching attached image format)              */}
      {/* ========================================================================= */}
      {showConfirmPayModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header: Back on left, Close on right */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                onClick={() => setShowConfirmPayModal(false)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setShowConfirmPayModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Confirm & Pay</h2>
              <p className="text-xs text-gray-500">Are you sure to Pay?</p>
            </div>

            {/* Biller Logo & Name */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 my-2 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                MM
              </div>
              <span className="text-xs font-semibold text-gray-800">
                Mumbai Metro Rail Corporation
              </span>
            </div>

            {/* Form Fields matching image */}
            <div className="space-y-3.5 text-xs text-gray-700 my-4">
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
                  readOnly
                  value={grandTotal.toString()}
                  className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm font-mono text-gray-800 focus:outline-none"
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

              <div className="text-red-500 text-xs font-medium py-0.5">
                Total Amount Inclusive of additional fee + GST - Rs. {grandTotal.toFixed(2)}
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
                  <option value="Select Payment Account">Select Payment Account</option>
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

            {/* Confirm & Pay Orange CTA */}
            <div className="pt-2">
              <button
                onClick={handleTriggerOtp}
                className="w-full bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm py-2.5 rounded-md shadow-2xs transition-colors cursor-pointer text-center"
                id="commute-confirm-pay-modal-btn"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OTP VERIFICATION MODAL (Matching Credit Line)                    */}
      {/* ========================================================================= */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
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

      {/* ========================================================================= */}
      {/* MODAL 3: BILL PAYMENT SUCCESSFUL RECEIPT (Matching Credit Line)           */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
            {/* Header with Logos & Success message */}
            <PaymentSuccessModalHeader />

            {/* Biller Banner */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 my-2 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs border border-orange-200">
                MM
              </div>
              <span className="text-xs font-semibold text-gray-800">
                Mumbai Metro Rail Corporation Ltd.
              </span>
            </div>

            {/* 2-Column Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Total Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{grandTotal.toFixed(2)}
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
                    Route:
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {source} → {destination}
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
                  <span className="text-gray-600 font-normal">Payment Method:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[130px]" title={paymentMethod}>
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
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Pass Validity:</span>
                  <span className="font-semibold text-gray-900 font-mono">2 Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Customer Name:</span>
                  <span className="font-semibold text-gray-900">Srinadh</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setStep('ticket');
                }}
                className="flex-1 border border-orange-300 hover:bg-orange-50 text-[#fc8036] font-bold py-2.5 px-4 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <QrCode className="w-4 h-4 text-[#fc8036]" />
                <span>View Metro Ticket QR</span>
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  onBack();
                }}
                className="flex-1 bg-[#fc8036] hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-md text-xs cursor-pointer transition-colors shadow-2xs"
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

export default LocalCommuteFlow;
