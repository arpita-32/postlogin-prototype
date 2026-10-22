import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, Send, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export const ComplaintsView: React.FC = () => {
  const [complaintRef, setComplaintRef] = useState('');
  const [billerName, setBillerName] = useState('');
  const [txnId, setTxnId] = useState('');
  const [description, setDescription] = useState('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnId || !description) return;
    setComplaintSubmitted(true);
  };

  return (
    <div className="p-6 bg-white min-h-[calc(100vh-4rem)] space-y-6">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-2xl font-bold text-gray-800">BBPS Complaints & Dispute Resolution</h1>
        <p className="text-xs text-gray-500">Raise or track grievances regarding bill payments on Bharat BillPay network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Raise Complaint Form */}
        <div className="border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-[#fc8036]" />
            <span>Raise New BBPS Complaint</span>
          </h2>

          {complaintSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-emerald-900">Complaint Logged Successfully!</div>
              <div className="text-xs text-emerald-700 flex items-center justify-center space-x-1.5">
                <span>Complaint Reference ID:</span>
                <span className="font-mono font-bold text-gray-900 bg-emerald-100 px-2 py-0.5 rounded">BBPS-CMP-2026-99182</span>
                <button
                  onClick={() => handleCopy('BBPS-CMP-2026-99182', 'cmp-new')}
                  className="p-1 hover:bg-emerald-200 rounded text-emerald-800 transition-colors cursor-pointer"
                  title="Copy Complaint ID"
                >
                  {copied === 'cmp-new' ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={() => setComplaintSubmitted(false)}
                className="bg-[#fc8036] text-white font-bold text-xs py-2 px-4 rounded hover:bg-orange-600 transition-colors cursor-pointer"
              >
                Log Another Complaint
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Transaction Ref / BBPS ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOB2026072481912"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#fc8036]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Biller Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dakshin Gujarat Vij Company Limited"
                  value={billerName}
                  onChange={(e) => setBillerName(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#fc8036]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Issue Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your issue (e.g., amount debited but bill status not updated)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#fc8036]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#fc8036] hover:bg-orange-600 text-white font-bold py-2.5 rounded text-sm transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Grievance</span>
              </button>
            </form>
          )}
        </div>

        {/* Track Complaint Status */}
        <div className="border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-700" />
            <span>Track Complaint Status</span>
          </h2>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700">Complaint Ref ID</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. BBPS-CMP-2026-99182"
                value={complaintRef}
                onChange={(e) => setComplaintRef(e.target.value)}
                className="flex-1 border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-[#fc8036]"
              />
              <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 text-xs rounded transition-colors cursor-pointer">
                Track
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-2 text-gray-600">
            <div className="font-bold text-gray-800 border-b border-gray-200 pb-1">Sample Past Complaint</div>
            <div className="flex justify-between items-center">
              <span>Ref ID:</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-gray-900">BBPS-CMP-2026-88120</span>
                <button
                  onClick={() => handleCopy('BBPS-CMP-2026-88120', 'cmp-past')}
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Copy Past Complaint ID"
                >
                  {copied === 'cmp-past' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-semibold text-gray-800">Electricity</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                RESOLVED
              </span>
            </div>
            <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-200">
              Remark: Payment successfully updated with DGVCL on 21/07/2026.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
