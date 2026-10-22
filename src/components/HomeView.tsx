import React, { useState } from 'react';
import { Search, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { Biller, CategoryId, PendingBill } from '../types';

interface HomeViewProps {
  billers?: Biller[];
  onAddBiller?: (newBiller: Omit<Biller, 'slNo' | 'billStatus'>) => void;
  onFetchBill?: (billerName: string, amount: number) => void;
  onSelectCategory?: (categoryId: CategoryId) => void;
  onPayBillFromHome?: (bill: PendingBill) => void;
}

const DEFAULT_BILLERS: Biller[] = [
  {
    slNo: 1,
    name: 'Axis Bank Credit Card',
    authenticators: 'Registered Mobile Number : 7064232013',
    nickName: 'mirza satya test',
    pendingBills: 5884.83,
    billStatus: 'Unpaid',
    dueDate: '28/07/2026',
    category: 'credit-card',
  },
  {
    slNo: 2,
    name: 'Bank of Baroda FASTag',
    authenticators: 'Vehicle Number : od15j1478',
    nickName: 'Bank of Baroda FASTag',
    pendingBills: 0.00,
    billStatus: 'Paid',
    dueDate: '25/08/2026',
    category: 'fastag',
  },
  {
    slNo: 3,
    name: 'City Municipal Council Ranebennur',
    authenticators: 'ConnectionNo : 112',
    nickName: 'City Municipal Council Ranebennur',
    pendingBills: 504.00,
    billStatus: 'Scheduled',
    dueDate: '10/08/2026',
    category: 'water',
  },
  {
    slNo: 4,
    name: 'Dakshin Gujarat Vij Company Limited (DGVCL)-Fetch and pay',
    authenticators: 'Consumer Number : 12345',
    nickName: 'Dakshin Gujarat Vij Company Limited (DGVCL)-Fetch and pay',
    pendingBills: 2057773.69,
    billStatus: 'Unpaid',
    dueDate: '05/08/2026',
    category: 'electricity',
  },
  {
    slNo: 5,
    name: 'HDFC Credit Card',
    authenticators: 'Registered Mobile Number : 7735791830',
    nickName: 'pratushhdfc',
    pendingBills: 17172.00,
    billStatus: 'Expired',
    dueDate: '15/06/2026',
    category: 'credit-card',
  },
];

export function HomeView({
  billers: propBillers,
  onAddBiller,
  onFetchBill,
  onSelectCategory,
  onPayBillFromHome,
}: HomeViewProps) {
  const [localBillers, setLocalBillers] = useState<Biller[]>(DEFAULT_BILLERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' } | null>(null);
  const itemsPerPage = 5;

  const activeBillers = propBillers || localBillers;

  // New Biller Form State
  const [newBillerName, setNewBillerName] = useState('');
  const [newBillerAuth, setNewBillerAuth] = useState('');
  const [newBillerNick, setNewBillerNick] = useState('');
  const [newBillerAmount, setNewBillerAmount] = useState('');

  // Filter billers
  const filteredBillers = activeBillers.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.nickName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.authenticators.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredBillers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedBillers = filteredBillers.slice(startIndex, endIndex);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillerName || !newBillerAuth) return;

    const newBillerData = {
      name: newBillerName,
      authenticators: newBillerAuth,
      nickName: newBillerNick || newBillerName,
      pendingBills: parseFloat(newBillerAmount) || 0,
      billStatus: 'Unpaid' as const,
      dueDate: '25/09/2026',
    };

    if (onAddBiller) {
      onAddBiller(newBillerData);
    } else {
      const newBiller: Biller = {
        slNo: localBillers.length + 1,
        ...newBillerData,
      };
      setLocalBillers([newBiller, ...localBillers]);
    }

    // Reset fields
    setNewBillerName('');
    setNewBillerAuth('');
    setNewBillerNick('');
    setNewBillerAmount('');
    setIsAddOpen(false);

    setNotification({ message: `Successfully added biller "${newBillerName}"`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAction = (b: Biller) => {
    const status = b.billStatus || (b.pendingBills === 0 ? 'Paid' : 'Unpaid');

    if (status === 'Unpaid') {
      if (onPayBillFromHome) {
        onPayBillFromHome({
          id: `bill-${b.slNo}`,
          billerName: b.name,
          category: b.category || 'Electricity',
          amount: b.pendingBills,
          status: 'Unpaid',
          dueDate: b.dueDate,
          consumerNumber: b.authenticators,
        });
      } else if (onSelectCategory) {
        onSelectCategory('electricity');
      }
    } else {
      // Fetch action for Paid, Scheduled, or Expired
      if (onFetchBill) {
        onFetchBill(b.name, b.pendingBills);
      }
      setNotification({ message: `Fetching latest bill details for ${b.name}...`, type: 'info' });
      setTimeout(() => {
        setNotification({ message: `Latest bill details for ${b.name} updated.`, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }, 1000);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {notification.type === 'info' ? (
            <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="w-full bg-white rounded-lg border border-gray-100 shadow-sm p-6" id="home-view-container">
        {/* Top Banner & Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-display">Pay</h1>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#fc8036] hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-2 cursor-pointer"
            id="add-biller-trigger"
          >
            <Plus className="w-4 h-4" />
            <span>Add Biller</span>
          </button>
        </div>

        {/* Add Biller Modal overlay */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" id="add-biller-modal">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Add New BBPS Biller</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Biller Category / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore Electricity (BESCOM)"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#fc8036]"
                    value={newBillerName}
                    onChange={(e) => setNewBillerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Authenticator Detail (Account ID / Mob No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Registered Mobile Number : 9876543210"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#fc8036]"
                    value={newBillerAuth}
                    onChange={(e) => setNewBillerAuth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nick Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Home Electricity"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#fc8036]"
                    value={newBillerNick}
                    onChange={(e) => setNewBillerNick(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Current Outstanding / Pending Bill (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1250.00"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#fc8036]"
                    value={newBillerAmount}
                    onChange={(e) => setNewBillerAmount(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#fc8036] text-white rounded text-sm font-semibold hover:bg-orange-600 cursor-pointer"
                  >
                    Add Biller
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search Input Section */}
        <div className="relative mb-6 max-w-xs" id="search-biller-container">
          <input
            type="text"
            placeholder="Search Biller..."
            className="w-full border border-gray-200 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#fc8036] focus:ring-1 focus:ring-orange-100 transition-all font-sans"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset to first page
            }}
            id="search-biller-input"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Billers Table */}
        <div className="overflow-x-auto w-full border border-gray-100 rounded-lg shadow-inner" id="billers-table-wrapper">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider font-display select-none">
                <th className="py-4 px-5 w-16 text-center">Sl No.</th>
                <th className="py-4 px-4 w-1/4">Biller</th>
                <th className="py-4 px-4 w-1/4">Authenticators</th>
                <th className="py-4 px-4">Nick Name</th>
                <th className="py-4 px-4">Bill Amount</th>
                <th className="py-4 px-4 text-center">Bill Status</th>
                <th className="py-4 px-5 text-center w-28">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {paginatedBillers.length > 0 ? (
                paginatedBillers.map((b) => {
                  const status = b.billStatus || (b.pendingBills === 0 ? 'Paid' : 'Unpaid');

                  return (
                    <tr key={b.slNo} className="hover:bg-orange-50/20 transition-colors group">
                      {/* Sl No */}
                      <td className="py-4 px-5 text-center font-mono text-xs text-gray-400">
                        {b.slNo}
                      </td>

                      {/* Biller */}
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-xs text-[#fc8036] group-hover:scale-105 transition-transform">
                            {b.name.charAt(0)}
                          </div>
                          <span className="truncate max-w-[220px]" title={b.name}>
                            {b.name}
                          </span>
                        </div>
                      </td>

                      {/* Authenticator */}
                      <td className="py-4 px-4 text-xs text-gray-500 font-mono">
                        {b.authenticators}
                      </td>

                      {/* Nick Name */}
                      <td className="py-4 px-4 text-gray-600 truncate max-w-[160px]" title={b.nickName}>
                        {b.nickName}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 font-mono">
                            ₹
                            {b.pendingBills.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>

                          {status === 'Unpaid' && b.dueDate && (
                            <span className="text-[11px] text-red-600 font-medium mt-1">
                              Due By: {b.dueDate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {status === 'Unpaid' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Unpaid
                          </span>
                        )}

                        {status === 'Scheduled' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Scheduled
                          </span>
                        )}

                        {status === 'Paid' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        )}

                        {status === 'Expired' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleAction(b)}
                          className="border border-[#fc8036] hover:bg-[#fc8036] text-[#fc8036] hover:text-white font-semibold text-xs px-4 py-1.5 rounded transition-all duration-200 cursor-pointer"
                        >
                          {status === 'Unpaid' ? 'Pay' : 'Fetch'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No matching billers found in BBPS directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 select-none text-xs text-gray-500" id="pagination-panel">
          <div className="flex items-center space-x-2">
            <span>Items per page:</span>
            <select
              disabled
              className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-gray-50 text-gray-500 focus:outline-none"
            >
              <option>5</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <span>
              {totalItems > 0 ? `${startIndex + 1} – ${endIndex} of ${totalItems}` : '0 of 0'}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded border border-gray-200 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed text-gray-300' : 'hover:bg-gray-50 text-gray-600 cursor-pointer'
                }`}
              >
                &lt;
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-1.5 rounded border border-gray-200 ${
                  currentPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed text-gray-300' : 'hover:bg-gray-50 text-gray-600 cursor-pointer'
                }`}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Categories</h2>
          <span className="text-xs text-gray-500 font-medium">Select a category to pay bill or recharge</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((cat) => {
            const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[cat.iconName] || Icons.HelpCircle;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className={`bg-white border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer group hover:-translate-y-0.5 relative ${
                  cat.isNew
                    ? 'border-orange-200 hover:border-[#fc8036] hover:shadow-md bg-gradient-to-b from-orange-50/25 to-white ring-1 ring-orange-100/80'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                {cat.isNew && (
                  <span className="absolute -top-2 right-2 bg-gradient-to-r from-[#fc8036] to-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs ring-2 ring-white animate-pulse">
                    NEW
                  </span>
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 transition-colors border ${
                    cat.isNew
                      ? 'bg-orange-50 text-[#fc8036] border-orange-100 group-hover:bg-[#fc8036] group-hover:text-white'
                      : 'bg-gray-50 group-hover:bg-orange-50 text-gray-600 group-hover:text-[#fc8036] border-gray-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 leading-snug line-clamp-2">
                  {cat.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomeView;

