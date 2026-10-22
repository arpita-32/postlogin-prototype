import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Check,
  ChevronDown,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Copy,
  Download,
  QrCode,
  MapPin,
  Sparkles,
  CreditCard,
  Building,
  Wallet,
  X,
  Timer
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { PaymentSuccessModalHeader } from './PaymentSuccessModalHeader';

interface TourismFlowProps {
  onBack: () => void;
}

interface Destination {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  pricePerPerson: number;
  availableSlots: string[];
}

const DESTINATIONS_MUMBAI: Destination[] = [
  {
    id: 'gateway-of-india',
    name: 'Gateway of India',
    subtitle: 'Iconic Monument',
    tag: 'Historic Landmark',
    pricePerPerson: 100,
    availableSlots: ['11:00 - 12:00', '14:00 - 15:00', '17:00 - 18:00'],
  },
  {
    id: 'csmt',
    name: 'Chhatrapati Shivaji Maharaj Terminus',
    subtitle: 'Historic Railway Station',
    tag: 'Heritage Walk',
    pricePerPerson: 100,
    availableSlots: ['10:00 - 11:30', '14:00 - 15:00', '16:30 - 18:00'],
  },
  {
    id: 'elephanta-caves',
    name: 'Elephanta Caves',
    subtitle: 'UNESCO World Heritage Site',
    tag: 'Ferry + Entry Pass',
    pricePerPerson: 120,
    availableSlots: ['11:00 - 12:00', '14:00 - 15:00', '17:00 - 18:00'],
  },
  {
    id: 'csm-museum',
    name: 'Chhatrapati Shivaji Museum',
    subtitle: 'History & Art Gallery',
    tag: 'Museum Entry',
    pricePerPerson: 100,
    availableSlots: ['11:00 - 12:00', '14:00 - 15:00', '17:00 - 18:00'],
  },
  {
    id: 'marine-drive',
    name: 'Marine Drive & Promenade',
    subtitle: 'Scenic Heritage Boulevard',
    tag: "Queen's Necklace",
    pricePerPerson: 50,
    availableSlots: ['06:00 - 09:00', '17:00 - 19:30', '20:00 - 22:00'],
  },
  {
    id: 'juhu-beach',
    name: 'Juhu Beach Heritage Pavilion',
    subtitle: 'Popular Beach Destination',
    tag: 'Sunset View Walk',
    pricePerPerson: 50,
    availableSlots: ['07:00 - 10:00', '16:00 - 18:30', '19:00 - 21:00'],
  },
  {
    id: 'sanjay-gandhi-np',
    name: 'Sanjay Gandhi National Park',
    subtitle: 'Urban Park & Kanheri Caves',
    tag: 'Kanheri Caves Safari',
    pricePerPerson: 85,
    availableSlots: ['09:00 - 11:00', '12:00 - 14:00', '15:00 - 17:30'],
  },
  {
    id: 'haji-ali',
    name: 'Haji Ali Dargah',
    subtitle: 'Famous Heritage Island Shrine',
    tag: 'Spiritual Heritage',
    pricePerPerson: 50,
    availableSlots: ['08:00 - 11:00', '14:00 - 16:30', '17:30 - 19:30'],
  },
];

const STATE_CITY_MAP_TOURISM: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Aurangabad (Chhatrapati Sambhajinagar)', 'Nashik', 'Nagpur', 'Kolhapur'],
  'Delhi NCR': ['Delhi', 'New Delhi', 'Old Delhi Heritage Zone', 'Noida', 'Gurgaon'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hampi', 'Mangaluru', 'Badami'],
  'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar'],
  'Goa': ['Panaji', 'Old Goa', 'Calangute', 'Margao'],
  'Gujarat': ['Ahmedabad', 'Vadodara (Statue of Unity)', 'Surat', 'Bhuj'],
  'Tamil Nadu': ['Chennai', 'Madurai', 'Mahabalipuram', 'Thanjavur'],
  'Uttar Pradesh': ['Agra (Taj Mahal)', 'Varanasi', 'Lucknow', 'Ayodhya', 'Mathura'],
  'West Bengal': ['Kolkata', 'Darjeeling', 'Sundarbans', 'Howrah'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Alappuzha', 'Munnar'],
};

export const TourismFlow: React.FC<TourismFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState<'search' | 'destinations' | 'slots' | 'summary' | 'ticket'>('search');

  // Search Parameters (unpopulated by default for manual selection)
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [date, setDate] = useState<string>('2026-07-14');
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);

  // Destinations Selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([
    'gateway-of-india',
    'elephanta-caves',
  ]);

  // Destination Slots Map (destinationId -> chosen slot)
  const [destinationSlots, setDestinationSlots] = useState<Record<string, string>>({
    'gateway-of-india': '14:00 - 15:00',
    'elephanta-caves': '14:00 - 15:00',
  });

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

  const totalPassengers = adults + children;

  // Candidate destinations from Step 2
  const candidateDestinations = DESTINATIONS_MUMBAI.filter((d) =>
    selectedDestinationIds.includes(d.id)
  );

  // Active / Included destination IDs in Step 3 (all selected by default)
  const [includedSlotDestinationIds, setIncludedSlotDestinationIds] = useState<string[]>([
    'gateway-of-india',
    'elephanta-caves',
  ]);

  // Active destination objects included in the booking (used for Fare, Summary, Receipt & Ticket)
  const activeDestinations = DESTINATIONS_MUMBAI.filter(
    (d) => selectedDestinationIds.includes(d.id) && includedSlotDestinationIds.includes(d.id)
  );

  // Total Fare calculation
  const totalFare = activeDestinations.reduce((acc, d) => {
    return acc + d.pricePerPerson * (adults > 0 ? adults : 1);
  }, 0);

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

  // Format Display Date
  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Tuesday, July 14, 2026';
    }
  };

  const formatShortDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '14 July 2026';
    }
  };

  // Toggle destination checkbox
  const toggleDestination = (id: string) => {
    if (selectedDestinationIds.includes(id)) {
      setSelectedDestinationIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedDestinationIds((prev) => [...prev, id]);
      if (!destinationSlots[id]) {
        const dest = DESTINATIONS_MUMBAI.find((d) => d.id === id);
        if (dest && dest.availableSlots.length > 0) {
          setDestinationSlots((prev) => ({ ...prev, [id]: dest.availableSlots[0] }));
        }
      }
    }
  };

  // Set slot for a destination
  const setSlotForDestination = (destId: string, slot: string) => {
    setDestinationSlots((prev) => ({ ...prev, [destId]: slot }));
  };

  // Toggle destination inclusion in slots step
  const toggleSlotDestinationInclusion = (id: string) => {
    setIncludedSlotDestinationIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Copy Ticket Summary
  const handleCopyTicket = async () => {
    const lines = activeDestinations.map(
      (d) =>
        `- ${d.name} (${destinationSlots[d.id] || '14:00 - 15:00'} | Date: ${formatShortDate(
          date
        )} | Pass: ${totalPassengers} | Fare: ₹${d.pricePerPerson * totalPassengers})`
    );
    const summary = `=== DIGITAL TOURISM TICKET ===\nStatus: ENTRY CONFIRMED\nBooking Ref: BCTR2026051724893\nState: ${state} | City: ${city}\nDate: ${formatShortDate(
      date
    )}\nPassengers: ${totalPassengers} (${adults} Adults, ${children} Children)\n\nDestinations:\n${lines.join(
      '\n'
    )}\n\nTotal Fare: ₹${totalFare}.00`;

    await copyToClipboard(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyField = async (text: string, fieldKey: string) => {
    await copyToClipboard(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered destinations in Step 2
  const filteredDestinations = DESTINATIONS_MUMBAI.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              if (step === 'search') {
                onBack();
              } else if (step === 'destinations') {
                setStep('search');
              } else if (step === 'slots') {
                setStep('destinations');
              } else if (step === 'summary') {
                setStep('slots');
              } else if (step === 'ticket') {
                onBack();
              }
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
            title="Go Back"
            id="tourism-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 font-display">
            Tourism Ticket Booking
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: Tourism Search / City / Date / Passenger Steppers                 */}
        {/* ========================================================================= */}
        {step === 'search' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fc8036]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-gray-800 font-display">Tourism Ticket Booking</h2>
                  <span className="bg-[#fc8036] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-gray-500">Book monument entry, heritage walks & tourist passes across India</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State Selection */}
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
                    {Object.keys(STATE_CITY_MAP_TOURISM).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* City Selection */}
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
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : city
                        ? 'border-[#fc8036] text-gray-800'
                        : 'border-gray-300 text-gray-500 focus:border-[#fc8036]'
                    }`}
                  >
                    <option value="">{state ? '-- Select City --' : '-- Select State First --'}</option>
                    {state &&
                      STATE_CITY_MAP_TOURISM[state]?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                      city ? 'text-[#fc8036]' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Validation Message if any */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Date Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date of Visit
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  min="2026-01-01"
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 focus:border-[#fc8036] rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none transition-colors cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Selected visit date: <span className="font-semibold text-gray-700">{formatDisplayDate(date)}</span>
              </p>
            </div>

            {/* Steppers for Adults and Children in Orange Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* No. of Adults */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700 block">No. of Adults</span>
                  <span className="text-[11px] text-gray-500">Age 12+ years</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={adults <= 1}
                    onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-orange-50 hover:border-[#fc8036] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center justify-center text-base font-bold text-gray-700 shadow-2xs cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-base text-gray-900 font-mono">
                    {adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdults((prev) => Math.min(10, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-orange-50 hover:border-[#fc8036] flex items-center justify-center text-base font-bold text-gray-800 shadow-2xs cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* No. of Children */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700 block">No. of Children</span>
                  <span className="text-[11px] text-gray-500">Below 12 years</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={children <= 0}
                    onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-orange-50 hover:border-[#fc8036] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center justify-center text-base font-bold text-gray-700 shadow-2xs cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-base text-gray-900 font-mono">
                    {children}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChildren((prev) => Math.min(10, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-orange-50 hover:border-[#fc8036] flex items-center justify-center text-base font-bold text-gray-800 shadow-2xs cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTA (Orange Theme) */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  if (!state) {
                    setValidationError('Please select a State to find tourism destinations.');
                    return;
                  }
                  if (!city) {
                    setValidationError('Please select a City to find tourism destinations.');
                    return;
                  }
                  setValidationError(null);
                  setStep('destinations');
                }}
                className="w-full bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                id="tourism-search-proceed-btn"
              >
                <span>Proceed to Choose Destinations →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Select Tourism Destination (List with Checkboxes)                 */}
        {/* ========================================================================= */}
        {step === 'destinations' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800 font-display">Select Tourism Destination</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {formatDisplayDate(date)} • {city}, {state}
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 text-[#fc8036] px-3 py-1 rounded-full text-xs font-bold">
                {selectedDestinationIds.length} Selected
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search monuments, caves, landmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#fc8036]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Destination Checkbox List */}
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {filteredDestinations.map((dest) => {
                const isSelected = selectedDestinationIds.includes(dest.id);

                return (
                  <div
                    key={dest.id}
                    onClick={() => toggleDestination(dest.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-orange-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-gray-900 text-sm">{dest.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{dest.subtitle}</p>
                    </div>

                    {/* Checkbox box */}
                    <div
                      className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#fc8036] border-[#fc8036] text-white shadow-xs'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Bar (Orange Theme) */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setStep('search')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setIncludedSlotDestinationIds(selectedDestinationIds);
                  setStep('slots');
                }}
                disabled={selectedDestinationIds.length === 0}
                className={`px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                  selectedDestinationIds.length > 0
                    ? 'bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                id="tourism-destinations-next-btn"
              >
                Next ({selectedDestinationIds.length} Selected) →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Pick Destination & Time Slots (Orange Theme)                      */}
        {/* ========================================================================= */}
        {step === 'slots' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800 font-display">Pick Destination & Slots</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {formatDisplayDate(date)} • Total Visitors: {totalPassengers} • <strong className="text-gray-700">{activeDestinations.length} of {candidateDestinations.length}</strong> Selected
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-gray-700 bg-orange-50/70 px-3 py-1.5 rounded-lg border border-orange-200">
                Total Payable: <span className="text-[#fc8036] text-sm">₹{totalFare}</span>
              </div>
            </div>

            {/* Sub-header instruction banner */}
            <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3 text-xs text-orange-950 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">✓</span>
                <span>
                  All previously selected destinations are included by default. Uncheck any destination if you wish to exclude it.
                </span>
              </div>
              <div className="hidden sm:block text-[11px] font-semibold text-orange-800">
                {activeDestinations.length} Selected
              </div>
            </div>

            {/* Destination Cards with Checkbox Toggle and Time Slot Selection */}
            <div className="space-y-4">
              {candidateDestinations.map((dest) => {
                const isIncluded = includedSlotDestinationIds.includes(dest.id);
                const currentSlot = destinationSlots[dest.id] || dest.availableSlots[0];
                const destFare = dest.pricePerPerson * (adults > 0 ? adults : 1);

                return (
                  <div
                    key={dest.id}
                    className={`border-2 rounded-2xl p-5 transition-all shadow-xs ${
                      isIncluded
                        ? 'border-orange-300 bg-white ring-1 ring-orange-200/60'
                        : 'border-gray-200 bg-gray-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-gray-100 gap-3">
                      {/* Checkbox and Destination info */}
                      <div className="flex items-start space-x-3">
                        <label className="flex items-center space-x-2.5 cursor-pointer select-none pt-0.5">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => toggleSlotDestinationInclusion(dest.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isIncluded
                                ? 'bg-[#fc8036] border-[#fc8036] text-white shadow-xs'
                                : 'border-gray-400 bg-white hover:border-gray-600'
                            }`}
                          >
                            {isIncluded && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </label>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3
                              onClick={() => toggleSlotDestinationInclusion(dest.id)}
                              className={`font-bold text-base cursor-pointer hover:text-[#fc8036] transition-colors ${
                                isIncluded ? 'text-gray-900' : 'text-gray-500 line-through'
                              }`}
                            >
                              {dest.name}
                            </h3>
                            {isIncluded ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                Included
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-200 text-gray-600 font-medium px-2 py-0.5 rounded">
                                Deselected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{dest.subtitle || dest.tag}</p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <span
                          className={`text-sm font-bold font-mono ${
                            isIncluded ? 'text-gray-900' : 'text-gray-400 line-through'
                          }`}
                        >
                          ₹ {destFare}
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          ₹{dest.pricePerPerson}/person × {adults} adult{adults > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Slot Selection Pills */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-xs font-semibold ${isIncluded ? 'text-gray-700' : 'text-gray-400'}`}>
                          Select Time Slot
                        </label>
                        {!isIncluded && (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Check the box above to include this destination & slots
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {dest.availableSlots.map((slotStr) => {
                          const isChosen = isIncluded && currentSlot === slotStr;
                          return (
                            <button
                              key={slotStr}
                              type="button"
                              disabled={!isIncluded}
                              onClick={() => setSlotForDestination(dest.id, slotStr)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                                !isIncluded
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : isChosen
                                  ? 'bg-[#fc8036] text-white border-[#fc8036] shadow-xs cursor-pointer'
                                  : 'bg-gray-50 hover:bg-orange-50/40 text-gray-700 border-gray-200 cursor-pointer'
                              }`}
                            >
                              {slotStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action CTA (Orange Theme) */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setStep('destinations')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Modify Destinations
              </button>
              <button
                onClick={() => setStep('summary')}
                disabled={activeDestinations.length === 0}
                className={`px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                  activeDestinations.length > 0
                    ? 'bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                id="tourism-review-and-pay-btn"
              >
                {activeDestinations.length > 0
                  ? `Review Details (₹${totalFare}) →`
                  : 'Select at least 1 destination'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: Booking Summary / Review Details                                  */}
        {/* ========================================================================= */}
        {step === 'summary' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800 font-display">Tourism Booking Summary</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Please review your tourist attraction passes and entry slots before payment
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 text-[#fc8036] px-3.5 py-1 rounded-full text-xs font-bold">
                {activeDestinations.length} Destination{activeDestinations.length > 1 ? 's' : ''} Selected
              </div>
            </div>

            {/* Main Booking Details Overview */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-[#fc8036] flex items-center justify-center font-bold text-base border border-orange-200">
                    🏛️
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {city || 'Mumbai'}, {state || 'Maharashtra'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Date of Visit: <span className="text-gray-800 font-semibold">{formatShortDate(date)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-500 block">Total Visitors</span>
                  <span className="text-sm font-bold text-gray-900 font-mono">
                    {totalPassengers} ({adults} Adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''})
                  </span>
                </div>
              </div>

              {/* Grid of Key Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">State / Region</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{state || 'Maharashtra'}</span>
                  <span className="text-[11px] text-gray-500">{city || 'Mumbai'}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Date of Visit</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{date}</span>
                  <span className="text-[11px] text-gray-500">Confirmed Entry</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Pass Count</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{totalPassengers} Passes</span>
                  <span className="text-[11px] text-gray-500">{adults}A {children > 0 ? `+ ${children}C` : ''}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Pass Status</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">Ready to Issue</span>
                  <span className="text-[11px] text-gray-500">Instant QR</span>
                </div>
              </div>

              {/* Selected Monuments & Slots Detailed List */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-700 block">Selected Destinations & Time Slots</span>
                <div className="space-y-3 pt-1">
                  {activeDestinations.map((dest) => {
                    const slot = destinationSlots[dest.id] || dest.availableSlots[0];
                    const destFare = dest.pricePerPerson * (adults > 0 ? adults : 1);

                    return (
                      <div
                        key={dest.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 text-xs sm:text-sm">{dest.name}</span>
                            <span className="text-[10px] bg-orange-100 text-[#fc8036] font-bold px-2 py-0.5 rounded">
                              {dest.tag}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>Entry Slot: <strong className="text-gray-700 font-semibold">{slot}</strong></span>
                            <span>•</span>
                            <span>{adults} Visitor{adults > 1 ? 's' : ''}</span>
                          </p>
                        </div>

                        <div className="text-right sm:self-center">
                          <span className="text-sm font-bold text-gray-900 font-mono block">
                            ₹ {destFare}.00
                          </span>
                          <span className="text-[10px] text-gray-400">
                            (₹{dest.pricePerPerson} × {adults} adult{adults > 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fare Breakdown Table */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block text-xs">Fare Breakdown</span>
                <div className="divide-y divide-gray-100">
                  {activeDestinations.map((dest) => (
                    <div key={dest.id} className="flex justify-between py-1.5 text-gray-600">
                      <span>{dest.name} ({adults} Adult{adults > 1 ? 's' : ''})</span>
                      <span className="font-mono text-gray-900">₹ {dest.pricePerPerson * (adults > 0 ? adults : 1)}.00</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2.5 pb-1 text-sm font-bold text-gray-900">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-base text-[#fc8036]">₹ {totalFare}.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions (Orange theme) */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setStep('slots')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Modify Slots
              </button>
              <button
                onClick={() => {
                  setShowConfirmPayModal(true);
                }}
                className="px-8 py-3.5 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center space-x-2"
                id="tourism-summary-confirm-pay-btn"
              >
                <span>Confirm & Pay (₹{totalFare}) →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: Final Digital Tourism Pass QR Screen                              */}
        {/* ========================================================================= */}
        {step === 'ticket' && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden space-y-6">
            {/* Header Title */}
            <div className="bg-[#fc8036] text-white p-5 text-center space-y-1">
              <h3 className="font-bold text-base">
                Tourism Authority • Digital Entry Pass
              </h3>
              <p className="text-xs text-orange-100 font-semibold">
                {city}, {state} • {formatShortDate(date)}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Validity Badge */}
              <div className="flex justify-center">
                <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ENTRY CONFIRMED</span>
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
                      🏛️
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Breakdown for each booked monument */}
              <div className="space-y-3 divide-y divide-gray-100 text-xs">
                {activeDestinations.map((dest) => (
                  <div key={dest.id} className="pt-2 space-y-1 text-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Monument:</span>
                      <span className="font-bold text-gray-900">{dest.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-semibold text-gray-800">{formatShortDate(date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Slot:</span>
                      <span className="font-mono font-semibold text-gray-800">
                        {destinationSlots[dest.id] || '14:00 - 15:00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Visitors:</span>
                      <span className="font-mono font-semibold text-gray-800">{totalPassengers} ({adults} Adults)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Fare:</span>
                      <span className="font-mono font-bold text-gray-900">
                        ₹ {dest.pricePerPerson * totalPassengers}.00
                      </span>
                    </div>
                  </div>
                ))}

                <div className="pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Total Amount Paid</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-base text-[#fc8036]">₹ {totalFare}.00</span>
                    <button
                      onClick={() => handleCopyField(`₹ ${totalFare}.00`, 'fare')}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      title="Copy Total Fare"
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
                  id="tourism-back-to-home-btn"
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
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fc8036] flex items-center justify-center font-bold text-xs border border-orange-200">
                TA
              </div>
              <span className="text-xs font-semibold text-gray-800">
                Tourism Authority of India
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
                  value={totalFare.toString()}
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
                Total Amount Inclusive of additional fee + GST - Rs. {totalFare.toFixed(2)}
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
                id="tourism-confirm-pay-modal-btn"
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
                TA
              </div>
              <span className="text-xs font-semibold text-gray-800">
                Tourism Authority of India Ltd.
              </span>
            </div>

            {/* 2-Column Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Payment Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{totalFare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Total Amount:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{totalFare.toFixed(2)}
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
                    Monuments:
                  </span>
                  <span className="font-semibold text-gray-900 truncate max-w-[140px]" title={activeDestinations.map((d) => d.name).join(', ')}>
                    {activeDestinations.map((d) => d.name).join(', ')}
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
                    ₹{totalFare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-normal">Pass Validity:</span>
                  <span className="font-semibold text-gray-900 font-mono">{formatShortDate(date)}</span>
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
                <span>View Tourism Pass QR</span>
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

export default TourismFlow;
