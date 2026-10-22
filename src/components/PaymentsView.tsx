import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Pencil,
  FileText,
  X,
  Check,
  Copy,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Train,
  QrCode,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Transaction } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/mockData';
import { copyToClipboard } from '../utils/clipboard';

interface PaymentsViewProps {
  transactions?: Transaction[];
}

export function PaymentsView({ transactions: propTransactions }: PaymentsViewProps) {
  const allTransactions = propTransactions && propTransactions.length > 0
    ? propTransactions
    : INITIAL_TRANSACTIONS;

  // Date filters - default from 7/1/2026 to 8/31/2026 (matching screenshot)
  const [fromDate, setFromDate] = useState('2026-07-01');
  const [toDate, setToDate] = useState('2026-08-31');
  const [activeDateFilter, setActiveDateFilter] = useState<{ from: string; to: string }>({
    from: '2026-07-01',
    to: '2026-08-31',
  });

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Notifications
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [complaintTxn, setComplaintTxn] = useState<Transaction | null>(null);
  const [complaintReason, setComplaintReason] = useState('Amount debited but bill not updated');
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      showToast('Please select both From Date and To Date');
      return;
    }
    setActiveDateFilter({ from: fromDate, to: toDate });
    setCurrentPage(1);
    showToast(`Filtered transactions from ${fromDate} to ${toDate}`);
  };

  // Filtered dataset based on search, category and dates
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Search matching biller, account, or ref
      const matchesSearch =
        searchQuery.trim() === '' ||
        tx.billerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.accountDetails && tx.accountDetails.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.txnRefNo && tx.txnRefNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [allTransactions, searchQuery]);

  // Pagination calculation
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Helper to determine category initials / logo code
  const getBillerInitials = (tx: Transaction) => {
    if (tx.billerLogoCode) return tx.billerLogoCode;
    const words = tx.billerName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return tx.billerName.slice(0, 2).toUpperCase();
  };

  // Format date helper (e.g. 2026-07-01 -> 7/1/2026)
  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '';
    if (dStr.includes('/')) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}/${parts[0]}`;
    }
    return dStr;
  };

  const isLocalCommuteOrTourism = (cat?: string) => {
    if (!cat) return false;
    const c = cat.toLowerCase();
    return c.includes('tourism') || c.includes('local commute') || c.includes('commute');
  };

  const downloadTextFile = (filename: string, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadReceipt = (tx: Transaction) => {
    const refNo = tx.txnRefNo || tx.txnId || 'BB116237145698';
    const content = `============================================================
              BHARAT CONNECT - PAYMENT RECEIPT
============================================================
Biller Name:      ${tx.billerName}
Category:         ${tx.category}
Account Details:  ${tx.accountDetails || tx.subscriberNumber || 'NA'}
Subscriber No:    ${tx.subscriberNumber || 'NA'}
Payment Amount:   Rs. ${tx.amount.toFixed(2)}
Convenience Fee:  Rs. ${tx.convenienceFee || 0}.00
Total Paid:       Rs. ${tx.amount.toFixed(2)}
Payment Status:   ${tx.status || 'SUCCESS'}
Biller Status:    ${tx.billerStatus || 'SUCCESS'}
Payment Method:   ${tx.paymentMethod || tx.paymentMode || 'UPI / Internet Banking'}
Payment Type:     ${tx.paymentType || 'Bill Payment'}
Txn Ref Number:   ${refNo}
Date & Time:      ${tx.dateTime || tx.date}
Bharat Connect ID: BB116237145698e7e3fc
Source Ref No:    284627090
============================================================
Thank you for using Bharat Connect.
============================================================`;

    downloadTextFile(`Receipt_${tx.billerName.replace(/\s+/g, '_')}_${refNo}.txt`, content);
    showToast(`Payment Receipt downloaded for ${tx.billerName}`);
  };

  const handleDownloadPass = (tx: Transaction) => {
    const isCommute = tx.category.toLowerCase().includes('commute');
    const refNo = tx.txnRefNo || tx.txnId || 'PASS20260828';

    let content = '';
    if (isCommute) {
      const j = tx.journeyDetails;
      content = `============================================================
          BHARAT CONNECT - LOCAL COMMUTE TRANSIT PASS
============================================================
Biller:           ${tx.billerName}
Category:         Local Commute (${j?.transitMode || 'Metro Rail'})
Pass Type:        ${j?.journeyType || 'Single Journey'}
Route:            ${j?.source || 'DADAR'} ➔ ${j?.destination || 'POISAR'}
Transit Line:     ${j?.route || 'Line 1 ➔ Line 7'}
Passengers:       ${j?.travellers || 1} Adult
Validity:         ${j?.validTill || '2 Hours from Entry Tap'}
Payment Status:   Rs. ${tx.amount.toFixed(2)} [PAID / SUCCESS]
Booking Ref No:   ${refNo}
Date & Time:      ${tx.dateTime || tx.date}
------------------------------------------------------------
[SCANNABLE AFC AUTOMATED GATE QR PAYLOAD]
METRO:MMRC:TKT-${refNo}:${j?.source || 'DADAR'}-${j?.destination || 'POISAR'}:VAL2HRS
------------------------------------------------------------
Present this digital pass at the automated AFC gate scanner.
============================================================`;
    } else {
      const t = tx.tourismDetails;
      const monumentsList = t?.destinations && t.destinations.length > 0
        ? t.destinations.map((d) => `  * ${d}`).join('\n')
        : '  * Gateway of India & Elephanta Caves\n  * CSMVS Heritage Museum';

      content = `============================================================
          BHARAT CONNECT - DIGITAL TOURISM ENTRY PASS
============================================================
Biller:           ${tx.billerName}
Category:         Tourism Heritage Pass
Location:         ${t?.city || 'Mumbai'}, ${t?.state || 'Maharashtra'}
Date of Visit:    ${t?.visitDate || tx.date}
Time Slot:        ${t?.slotTime || '10:00 AM - 01:00 PM'}
Visitors:         ${t?.adults || 2} Adult(s)${t?.children ? `, ${t.children} Child(ren)` : ''}
Attractions Included:
${monumentsList}
Payment Status:   Rs. ${tx.amount.toFixed(2)} [PAID / SUCCESS]
Booking Ref No:   ${refNo}
Date of Booking:  ${tx.dateTime || tx.date}
------------------------------------------------------------
[SCANNABLE MONUMENT ENTRY GATE QR PAYLOAD]
TOURISM:HERITAGE:${refNo}:${t?.city || 'MUMBAI'}:SLOT-${t?.slotTime || '10AM'}
------------------------------------------------------------
Present this digital pass at the heritage monument entry gate.
============================================================`;
    }

    downloadTextFile(`Pass_${tx.billerName.replace(/\s+/g, '_')}_${refNo}.txt`, content);
    showToast(`Digital Pass downloaded for ${tx.billerName}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6" id="payments-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900/95 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center space-x-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">
          Recent Transactions
        </h1>
      </div>

      {/* Date Range Selection Panel (Matching Screenshot 1) */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
        <form onSubmit={handleDateSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          {/* From Date */}
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              From Date*
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fc8036] focus:ring-1 focus:ring-orange-200 transition-colors font-sans cursor-pointer"
                id="payments-from-date-input"
              />
            </div>
          </div>

          {/* To Date */}
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              To Date*
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fc8036] focus:ring-1 focus:ring-orange-200 transition-colors font-sans cursor-pointer"
                id="payments-to-date-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-2.5 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm rounded-lg shadow-xs transition-all cursor-pointer h-[42px]"
              id="payments-date-submit-btn"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Search Biller Bar (Matching Screenshot 1) */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search Biller..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-gray-300 rounded-md px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#fc8036] transition-colors"
            id="payments-search-biller-input"
          />
        </div>
      </div>

      {/* Transactions Table (Matching Screenshot 1) */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] sm:text-xs font-semibold text-gray-600">
                <th className="py-3.5 px-4 font-medium">Sl No.</th>
                <th className="py-3.5 px-4 font-medium">Biller</th>
                <th className="py-3.5 px-4 font-medium">Account Details</th>
                <th className="py-3.5 px-4 font-medium">Amount</th>
                <th className="py-3.5 px-4 font-medium">Date</th>
                <th className="py-3.5 px-4 font-medium">Payment Status</th>
                <th className="py-3.5 px-4 font-medium text-center">Raise Complaint</th>
                <th className="py-3.5 px-4 font-medium text-center">View / Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx, idx) => {
                  const sl = startIndex + idx + 1;
                  const isSuccess =
                    tx.status === 'SUCCESS' ||
                    tx.status === 'Successful' ||
                    tx.status === 'success';

                  const isCommuteOrTourism = isLocalCommuteOrTourism(tx.category);

                  return (
                    <tr
                      key={tx.txnId || tx.refId || idx}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Sl No */}
                      <td className="py-4 px-4 text-gray-600 font-medium">{sl}</td>

                      {/* Biller with Initials Badge */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 uppercase flex-shrink-0">
                            {getBillerInitials(tx)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {tx.billerName}
                            </span>
                            {isCommuteOrTourism && (
                              <span className="text-[10px] bg-orange-100 text-[#fc8036] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5">
                                {tx.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Account Details */}
                      <td className="py-4 px-4 text-gray-700 font-mono text-xs">
                        {tx.accountDetails || tx.subscriberNumber || '29040100010976'}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-semibold text-gray-900 font-mono">
                        {tx.amount.toFixed(1)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-gray-600 text-xs">
                        {tx.date}
                      </td>

                      {/* Payment Status Badge (Matching Screenshot 1) */}
                      <td className="py-4 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center space-x-1.5 bg-[#e6f8ec] text-[#1b803a] text-xs font-semibold px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1b803a]"></span>
                            <span>SUCCESS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 bg-[#feeae9] text-[#d93025] text-xs font-semibold px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d93025]"></span>
                            <span>FAILED</span>
                          </span>
                        )}
                      </td>

                      {/* Raise Complaint Action */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => {
                            setComplaintTxn(tx);
                            setComplaintSuccess(false);
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Raise Complaint"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>

                      {/* View & Download Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedTxn(tx)}
                            className="p-1.5 text-gray-700 hover:text-[#fc8036] hover:bg-orange-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="View Details"
                            id={`view-details-btn-${sl}`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Separate Options for Tourism & Local Commute vs Standard */}
                          {isCommuteOrTourism ? (
                            <>
                              {/* Download Pass Option */}
                              <button
                                onClick={() => handleDownloadPass(tx)}
                                className="p-1.5 text-[#fc8036] hover:text-orange-700 hover:bg-orange-100 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="Download Pass"
                                id={`download-pass-btn-${sl}`}
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              {/* Download Receipt Option */}
                              <button
                                onClick={() => handleDownloadReceipt(tx)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="Download Receipt"
                                id={`download-receipt-btn-${sl}`}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            /* Standard Download Receipt Option */
                            <button
                              onClick={() => handleDownloadReceipt(tx)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Download Receipt"
                              id={`download-receipt-btn-${sl}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">No transactions found.</p>
                      <p className="text-xs text-gray-400">
                        Try modifying your search query or expanding the date filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Screenshot 1) */}
        <div className="flex items-center justify-end space-x-4 px-4 py-3 border-t border-gray-200 bg-white text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span>Items per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-[#fc8036] cursor-pointer bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>

          <div>
            <span>
              {totalItems === 0
                ? '0 - 0 of 0'
                : `${startIndex + 1} – ${endIndex} of ${totalItems}`}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW DETAILS MODAL (Matching Screenshot 2 & Custom QR for Commute/Tourism) */}
      {/* ========================================================================= */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header (Matching Screenshot 2) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              {/* Bharat Connect Logo */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-[#fc8036] tracking-tight">Bharat</span>
                <span className="text-xs font-black text-[#0f2e6b] tracking-tight">Connect</span>
              </div>

              {/* View Details Title */}
              <h3 className="text-base font-bold text-gray-900 font-display">
                View Details
              </h3>

              {/* Close Button */}
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Biller Card Box (Matching Screenshot 2) */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-200/70 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                    {getBillerInitials(selectedTxn)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      {selectedTxn.billerName}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-[11px] font-bold">
                  <span className="text-[#fc8036]">Bharat</span>
                  <span className="text-[#0f2e6b]">Connect</span>
                </div>
              </div>

              {/* Transaction Key-Value Rows (Matching Screenshot 2) */}
              <div className="divide-y divide-gray-100 text-xs">
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Subscriber Number</span>
                  <span className="text-gray-900 font-semibold font-mono">
                    {selectedTxn.subscriberNumber || 'NA'}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Payment Status</span>
                  <span className={`font-bold ${
                    selectedTxn.status === 'SUCCESS' || selectedTxn.status === 'Successful'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}>
                    {selectedTxn.status}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Biller Status</span>
                  <span className={`font-bold ${
                    selectedTxn.billerStatus === 'SUCCESS' || selectedTxn.status === 'SUCCESS'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}>
                    {selectedTxn.billerStatus || selectedTxn.status}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Payment Amount</span>
                  <span className="text-gray-900 font-bold font-mono text-sm">
                    {selectedTxn.amount.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Consumer Convenience Fee (CCF)</span>
                  <span className="text-gray-900 font-medium font-mono">
                    ₹{selectedTxn.convenienceFee || 0}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Transaction Date & Time</span>
                  <span className="text-gray-900 font-medium font-mono">
                    {selectedTxn.dateTime || selectedTxn.date}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 items-center">
                  <span className="text-gray-500 font-medium">Transaction Reference Number</span>
                  <div className="flex items-center space-x-1.5 font-mono text-gray-900 font-semibold">
                    <span>{selectedTxn.txnRefNo || selectedTxn.txnId || 'AB5416987654'}</span>
                    <button
                      onClick={() => handleCopy(selectedTxn.txnRefNo || selectedTxn.txnId || '', 'Ref No')}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      title="Copy Reference"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Payment Type</span>
                  <span className="text-gray-900 font-medium">
                    {selectedTxn.paymentType || 'NA'}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Payment Method</span>
                  <span className="text-gray-900 font-medium">
                    {selectedTxn.paymentMethod || selectedTxn.paymentMode || 'NA'}
                  </span>
                </div>
              </div>

              {/* ================================================================= */}
              {/* SPECIAL SECTION: JOURNEY & QR DETAILS (FOR LOCAL COMMUTE ONLY)    */}
              {/* ================================================================= */}
              {selectedTxn.category === 'Local Commute' && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-orange-200 bg-orange-50/40 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                    <div className="flex items-center space-x-2">
                      <Train className="w-4 h-4 text-[#fc8036]" />
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                        Local Commute Transit Pass
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                      VALID PASS
                    </span>
                  </div>

                  {/* Route details */}
                  <div className="bg-white p-3 rounded-lg border border-orange-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Route:</span>
                      <span className="font-bold text-gray-900">
                        {selectedTxn.journeyDetails?.source || 'DADAR'} ➔ {selectedTxn.journeyDetails?.destination || 'POISAR'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Transit Mode:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedTxn.journeyDetails?.transitMode || 'Metro Rail'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Line:</span>
                      <span className="font-medium text-gray-700 text-[11px]">
                        {selectedTxn.journeyDetails?.route || 'Line 1 ➔ Line 7'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Passengers / Type:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedTxn.journeyDetails?.travellers || 1} Adult ({selectedTxn.journeyDetails?.journeyType || 'Single Journey'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Validity:</span>
                      <span className="font-semibold text-emerald-600 text-[11px]">
                        {selectedTxn.journeyDetails?.validTill || '2 Hours from Entry Tap'}
                      </span>
                    </div>
                  </div>

                  {/* AFC Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
                    <div className="relative p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                        {/* QR Corners */}
                        <path d="M5,5 h22 v22 h-22 z M9,9 v14 h14 v-14 z M13,13 h6 v6 h-6 z" />
                        <path d="M73,5 h22 v22 h-22 z M77,9 v14 h14 v-14 z M81,13 h6 v6 h-6 z" />
                        <path d="M5,73 h22 v22 h-22 z M9,77 v14 h14 v-14 z M13,81 h6 v6 h-6 z" />
                        {/* Inner QR patterns */}
                        <rect x="35" y="6" width="6" height="6" />
                        <rect x="47" y="6" width="6" height="6" />
                        <rect x="59" y="6" width="6" height="6" />
                        <rect x="35" y="18" width="6" height="6" />
                        <rect x="53" y="18" width="6" height="6" />
                        <rect x="6" y="35" width="6" height="6" />
                        <rect x="18" y="35" width="6" height="6" />
                        <rect x="6" y="47" width="6" height="6" />
                        <rect x="18" y="53" width="6" height="6" />
                        <rect x="73" y="35" width="6" height="6" />
                        <rect x="85" y="35" width="6" height="6" />
                        <rect x="79" y="47" width="6" height="6" />
                        <rect x="91" y="53" width="6" height="6" />
                        <rect x="35" y="73" width="6" height="6" />
                        <rect x="47" y="73" width="6" height="6" />
                        <rect x="59" y="73" width="6" height="6" />
                        <rect x="41" y="85" width="6" height="6" />
                        <rect x="53" y="85" width="6" height="6" />
                        <rect x="65" y="85" width="6" height="6" />
                        <rect x="73" y="73" width="6" height="6" />
                        <rect x="85" y="73" width="6" height="6" />
                        <rect x="79" y="85" width="6" height="6" />
                      </svg>
                      {/* Center transit icon badge */}
                      <div className="absolute w-8 h-8 rounded-full bg-[#fc8036] text-white flex items-center justify-center text-xs font-black shadow border-2 border-white">
                        🚇
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600 mt-2 text-center">
                      Scan this QR at AFC automated gate scanner
                    </span>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SPECIAL SECTION: TOURISM DESTINATION & QR DETAILS (FOR TOURISM ONLY) */}
              {/* ================================================================= */}
              {selectedTxn.category === 'Tourism' && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-orange-200 bg-orange-50/40 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-4 h-4 text-[#fc8036]" />
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                        Tourism Digital Entry Pass
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                      CONFIRMED ENTRY
                    </span>
                  </div>

                  {/* Visit Details */}
                  <div className="bg-white p-3 rounded-lg border border-orange-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-bold text-gray-900">
                        {selectedTxn.tourismDetails?.city || 'Mumbai'}, {selectedTxn.tourismDetails?.state || 'Maharashtra'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Date of Visit:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedTxn.tourismDetails?.visitDate || selectedTxn.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Time Slot:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedTxn.tourismDetails?.slotTime || '10:00 AM - 01:00 PM'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Visitors:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedTxn.tourismDetails?.adults || 2} Adult(s) {selectedTxn.tourismDetails?.children ? `, ${selectedTxn.tourismDetails.children} Child(ren)` : ''}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-gray-100">
                      <span className="text-[11px] font-bold text-gray-700 block mb-1">Attractions:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-600 space-y-0.5">
                        {selectedTxn.tourismDetails?.destinations && selectedTxn.tourismDetails.destinations.length > 0 ? (
                          selectedTxn.tourismDetails.destinations.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))
                        ) : (
                          <>
                            <li>Gateway of India & Elephanta Caves</li>
                            <li>Chhatrapati Shivaji Maharaj Vastu Sangrahalaya</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Monument Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
                    <div className="relative p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                        {/* QR Corners */}
                        <path d="M5,5 h22 v22 h-22 z M9,9 v14 h14 v-14 z M13,13 h6 v6 h-6 z" />
                        <path d="M73,5 h22 v22 h-22 z M77,9 v14 h14 v-14 z M81,13 h6 v6 h-6 z" />
                        <path d="M5,73 h22 v22 h-22 z M9,77 v14 h14 v-14 z M13,81 h6 v6 h-6 z" />
                        {/* Inner QR patterns */}
                        <rect x="35" y="6" width="6" height="6" />
                        <rect x="47" y="6" width="6" height="6" />
                        <rect x="59" y="6" width="6" height="6" />
                        <rect x="35" y="18" width="6" height="6" />
                        <rect x="53" y="18" width="6" height="6" />
                        <rect x="6" y="35" width="6" height="6" />
                        <rect x="18" y="35" width="6" height="6" />
                        <rect x="6" y="47" width="6" height="6" />
                        <rect x="18" y="53" width="6" height="6" />
                        <rect x="73" y="35" width="6" height="6" />
                        <rect x="85" y="35" width="6" height="6" />
                        <rect x="79" y="47" width="6" height="6" />
                        <rect x="91" y="53" width="6" height="6" />
                        <rect x="35" y="73" width="6" height="6" />
                        <rect x="47" y="73" width="6" height="6" />
                        <rect x="59" y="73" width="6" height="6" />
                        <rect x="41" y="85" width="6" height="6" />
                        <rect x="53" y="85" width="6" height="6" />
                        <rect x="65" y="85" width="6" height="6" />
                      </svg>
                      {/* Center monument icon badge */}
                      <div className="absolute w-8 h-8 rounded-full bg-[#fc8036] text-white flex items-center justify-center text-xs font-black shadow border-2 border-white">
                        🏛️
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600 mt-2 text-center">
                      Present this QR at the heritage monument entry gate
                    </span>
                  </div>
                </div>
              )}

              {/* Download Action Buttons (Separated for Tourism & Local Commute) */}
              <div className="pt-2">
                {isLocalCommuteOrTourism(selectedTxn.category) ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Separate Option 1: Download Pass */}
                      <button
                        onClick={() => handleDownloadPass(selectedTxn)}
                        className="py-3 px-4 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                        id="view-details-download-pass-btn"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Download Pass</span>
                      </button>

                      {/* Separate Option 2: Download Receipt */}
                      <button
                        onClick={() => handleDownloadReceipt(selectedTxn)}
                        className="py-3 px-4 bg-white hover:bg-orange-50/50 active:bg-orange-100/60 text-gray-800 border-2 border-gray-300 hover:border-orange-300 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                        id="view-details-download-receipt-btn"
                      >
                        <FileText className="w-4 h-4 text-gray-700" />
                        <span>Download Receipt</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Categories (Single Download Receipt) */
                  <button
                    onClick={() => handleDownloadReceipt(selectedTxn)}
                    className="w-full py-3 bg-[#fc8036] hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                    id="view-details-download-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Receipt</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RAISE COMPLAINT MODAL                                                     */}
      {/* ========================================================================= */}
      {complaintTxn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 font-display">
                Raise Complaint
              </h3>
              <button
                onClick={() => setComplaintTxn(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {complaintSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Complaint Registered</h4>
                <p className="text-xs text-gray-600">
                  Complaint Ticket #<strong>CMP20260828{Math.floor(1000 + Math.random() * 9000)}</strong> has been registered for <strong>{complaintTxn.billerName}</strong>. You can track status under the Complaints tab.
                </p>
                <button
                  onClick={() => setComplaintTxn(null)}
                  className="mt-4 px-6 py-2 bg-[#fc8036] text-white font-bold text-xs rounded-lg shadow cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biller:</span>
                    <span className="font-semibold text-gray-800">{complaintTxn.billerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-gray-900 font-mono">₹{complaintTxn.amount.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ref ID:</span>
                    <span className="font-mono text-gray-700">{complaintTxn.txnRefNo || complaintTxn.txnId}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Complaint Reason
                  </label>
                  <select
                    value={complaintReason}
                    onChange={(e) => setComplaintReason(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fc8036] cursor-pointer"
                  >
                    <option value="Amount debited but bill not updated">Amount debited but bill not updated</option>
                    <option value="Transaction failed but amount deducted">Transaction failed but amount deducted</option>
                    <option value="Incorrect bill amount paid">Incorrect bill amount paid</option>
                    <option value="Payment duplicate charge">Payment duplicate charge</option>
                    <option value="Other grievance">Other grievance</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setComplaintTxn(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setComplaintSuccess(true)}
                    className="px-6 py-2 bg-[#fc8036] hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                  >
                    Submit Complaint
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentsView;
