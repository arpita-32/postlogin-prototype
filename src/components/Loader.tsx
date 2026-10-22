import React from "react";

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
      
      <div className="relative flex items-center justify-center">

        {/* Rotating Dashed Ring */}
        <div className="absolute w-28 h-28 rounded-full border-[5px] border-dashed border-[#fc8036] animate-spin"></div>

        {/* Logo Circle */}
        <div className="w-24 h-24 rounded-full shadow-lg flex items-center justify-center ">
          <img
            src="/loader.png"
            alt="Bank of Baroda"
            className="w-16 h-16 object-contain"
          />
        </div>

      </div>

    </div>
  );
}
