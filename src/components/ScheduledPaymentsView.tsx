import React from 'react';

export function ScheduledPaymentsView() {
  return (
    <div className="w-full bg-white rounded-lg border border-gray-100 shadow-sm min-h-[500px] flex flex-col justify-between" id="scheduled-view-container">
      {/* Header and Breadcrumbs remain styled matching the existing portal */}
      <div className="p-6 border-b border-gray-100 select-none">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-display">Scheduled Bill Payments</h1>
        <p className="text-xs text-gray-400 mt-1">Review upcoming auto-debited utility bills configured under standing instructions.</p>
      </div>

      {/* PERFECTLY CENTERED MESSAGE AREA WITH WHITE BACKGROUND */}
      <div className="flex-1 bg-white flex items-center justify-center py-20 px-6">
        <p className="text-xl font-bold text-gray-800 font-sans tracking-wide">
          No Bill Scheduled
        </p>
      </div>

      {/* Footer space matching page borders */}
      <div className="h-6 bg-white border-t border-gray-50 rounded-b-lg"></div>
    </div>
  );
}

export default ScheduledPaymentsView;
