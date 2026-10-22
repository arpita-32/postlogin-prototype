import React, { useState } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, Copy, Check, CheckCircle2 } from 'lucide-react';
import { Biller, SavedBiller } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface MyBillersViewProps {
  billers?: Biller[];
  onDeleteBiller?: (slNo: number) => void;
  onAddBiller?: (newBiller: Omit<Biller, 'slNo' | 'status'>) => void;
  onFetchBiller?: (biller: SavedBiller) => void;
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

export function MyBillersView({ billers: propBillers, onDeleteBiller, onAddBiller }: MyBillersViewProps) {
  const [localBillers, setLocalBillers] = useState<Biller[]>(DEFAULT_BILLERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const itemsPerPage = 5;

  const billers = propBillers || localBillers;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDuplicateBiller = (biller: Biller) => {
    const copyData = {
      name: biller.name,
      authenticators: biller.authenticators,
      nickName: `${biller.nickName} (Copy)`,
      pendingBills: biller.pendingBills,
      billStatus: biller.billStatus,
      dueDate: biller.dueDate,
      category: biller.category,
    };

    if (onAddBiller) {
      onAddBiller(copyData);
    } else {
      const newBiller: Biller = {
        slNo: localBillers.length > 0 ? Math.max(...localBillers.map(b => b.slNo)) + 1 : 1,
        ...copyData,
      };
      setLocalBillers(prev => [newBiller, ...prev]);
    }
    showToast(`Created a copy of biller "${biller.name}"`);
  };

  const handleCopyBillerDetails = async (biller: Biller) => {
    const text = `=== BBPS BILLER DETAILS ===\nBiller ID: BBPS-${biller.slNo}9201\nName: ${biller.name}\nNick Name: ${biller.nickName}\nAuthenticators: ${biller.authenticators}\nPending Bills: ₹${biller.pendingBills.toFixed(2)}\nDue Date: ${biller.dueDate}\nStatus: Active`;
    await copyToClipboard(text);
    setCopiedId(biller.slNo);
    showToast(`Copied details for ${biller.name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAuthString = async (authStr: string, slNo: number) => {
    await copyToClipboard(authStr);
    setCopiedId(`auth-${slNo}`);
    showToast(`Copied authenticator info`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // New Biller Form State
  const [newBillerName, setNewBillerName] = useState('');
  const [newBillerAuth, setNewBillerAuth] = useState('');
  const [newBillerNick, setNewBillerNick] = useState('');
  const [newBillerAmount, setNewBillerAmount] = useState('');

  // Filter billers
  const filteredBillers = billers.filter(b => 
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

  const handleDelete = (slNo: number) => {
    if (onDeleteBiller) {
      onDeleteBiller(slNo);
    } else {
      setLocalBillers(localBillers.filter(b => b.slNo !== slNo));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillerName || !newBillerAuth) return;
    
    const newBillerData = {
      name: newBillerName,
      authenticators: newBillerAuth,
      nickName: newBillerNick || newBillerName,
      pendingBills: parseFloat(newBillerAmount) || 0,
      billStatus: 'Unpaid' as const,
      dueDate: '25/09/2027',
    };

    if (onAddBiller) {
      onAddBiller(newBillerData);
    } else {
      setLocalBillers([...localBillers, { slNo: localBillers.length + 1, ...newBillerData }]);
    }

    // Reset fields
    setNewBillerName('');
    setNewBillerAuth('');
    setNewBillerNick('');
    setNewBillerAmount('');
    setIsAddOpen(false);
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-100 shadow-sm p-6" id="my-billers-view-container">
      {/* Top Banner & Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-display">My Billers</h1>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-[#fc8036] hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-2 cursor-pointer"
          id="my-billers-add-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Biller</span>
        </button>
      </div>

      {/* Add Biller Modal overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" id="my-billers-add-modal">
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
                  onChange={e => setNewBillerName(e.target.value)}
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
                  onChange={e => setNewBillerAuth(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nick Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Home Electricity" 
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#fc8036]"
                  value={newBillerNick}
                  onChange={e => setNewBillerNick(e.target.value)}
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
                  onChange={e => setNewBillerAmount(e.target.value)}
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

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Biller Details Modal Overlay */}
      {selectedBiller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" id="view-biller-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center space-x-2 text-[#fc8036]">
              <Eye className="w-5 h-5" />
              <span>Biller Registry Information</span>
            </h3>
            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Biller ID</span>
                <span className="col-span-2 text-gray-800 font-mono font-semibold">BBPS-{selectedBiller.slNo}9201</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Biller Name</span>
                <span className="col-span-2 text-gray-900 font-semibold">{selectedBiller.name}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Authenticators</span>
                <span className="col-span-2 text-gray-700 font-mono text-xs">{selectedBiller.authenticators}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Nick Name</span>
                <span className="col-span-2 text-gray-700">{selectedBiller.nickName}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Outstanding Bill</span>
                <span className="col-span-2 text-orange-600 font-mono font-semibold">₹{selectedBiller.pendingBills.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5">
                <span className="text-gray-400 font-medium">Auto-Debit Status</span>
                <span className="col-span-2 text-green-600 font-semibold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-ping"></span>
                  Active (BBPS Cleared)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-6 pt-2 border-t border-gray-100">
              <button 
                onClick={() => handleCopyBillerDetails(selectedBiller)}
                className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                id="copy-biller-modal-btn"
              >
                {copiedId === selectedBiller.slNo ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Make a Copy / Copy Info</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setSelectedBiller(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Section */}
      <div className="relative mb-6 max-w-xs" id="my-billers-search-box">
        <input 
          type="text"
          placeholder="Search Biller..."
          className="w-full border border-gray-200 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#fc8036] focus:ring-1 focus:ring-orange-100 transition-all font-sans"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset page
          }}
          id="my-billers-search-input"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Billers Table */}
      <div className="overflow-x-auto w-full border border-gray-100 rounded-lg shadow-inner" id="my-billers-table-wrapper">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider font-display select-none">
               <th className="py-4 px-5 w-16 text-center">Sl No.</th>
               <th className="py-4 px-4 w-1/4">Biller</th>
               <th className="py-4 px-4 w-1/3">Authenticators</th>
               <th className="py-4 px-4">Nick Name</th>
               <th className="py-4 px-3 text-center">Status</th>
               <th className="py-4 px-3 text-center w-28">Make a Copy</th>
               <th className="py-4 px-3 text-center w-20">View</th>
               <th className="py-4 px-3 text-center w-20">Modify</th>
               <th className="py-4 px-3 text-center w-20">Delete</th>
             </tr>
           </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {paginatedBillers.length > 0 ? (
              paginatedBillers.map((b) => (
                <tr key={b.slNo} className="hover:bg-orange-50/20 transition-colors group">
                  <td className="py-4 px-5 text-center font-mono text-xs text-gray-400">
                    {b.slNo}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-blue-700 group-hover:scale-105 transition-transform">
                        {b.name.charAt(0)}
                      </div>
                      <span className="truncate max-w-[180px]" title={b.name}>{b.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-gray-500 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="truncate max-w-[200px]" title={b.authenticators}>{b.authenticators}</span>
                      <button
                        onClick={() => handleCopyAuthString(b.authenticators, b.slNo)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Copy Authenticator text"
                      >
                        {copiedId === `auth-${b.slNo}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 truncate max-w-[120px]" title={b.nickName}>
                    {b.nickName}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                      Active
                    </span>
                  </td>
                  {/* Make a copy / Duplicate */}
                  <td className="py-4 px-3 text-center">
                    <button 
                      onClick={() => handleDuplicateBiller(b)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-[#fc8036] hover:text-white bg-orange-50 hover:bg-[#fc8036] border border-orange-200 rounded transition-all cursor-pointer"
                      title="Make a duplicate copy of this biller"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </td>
                  {/* View details */}
                  <td className="py-4 px-3 text-center">
                    <button 
                      onClick={() => setSelectedBiller(b)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors inline-block cursor-pointer"
                      title="View biller registry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Modify details */}
                  <td className="py-4 px-3 text-center">
                    <button 
                      onClick={() => {
                        alert(`Modification requested for: ${b.name}.\nThis high-fidelity prototype supports direct edits. Adjust authenticators in this section.`);
                      }}
                      className="p-1.5 hover:bg-gray-100 text-blue-600 hover:text-blue-700 rounded transition-colors inline-block cursor-pointer"
                      title="Modify biller authenticators"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Delete biller */}
                  <td className="py-4 px-3 text-center">
                    <button 
                      onClick={() => handleDelete(b.slNo)}
                      className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors inline-block cursor-pointer"
                      title="Delete biller from registry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-400">
                  No matching billers found in your registry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 select-none text-xs text-gray-500" id="my-billers-pagination">
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
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded border border-gray-200 ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed text-gray-300' : 'hover:bg-gray-50 text-gray-600 cursor-pointer'
              }`}
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
  );
}

export default MyBillersView;
