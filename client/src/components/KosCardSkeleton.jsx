import React from 'react';

export default function KosCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col">
      {/* Image Skeleton */}
      <div className="h-52 w-full bg-slate-200 relative">
        <div className="absolute top-3 left-3 w-16 h-5 bg-slate-300 rounded-full"></div>
        <div className="absolute bottom-3 left-3 w-28 h-6 bg-slate-300 rounded-lg"></div>
      </div>

      {/* Body Skeleton */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div className="w-24 h-3 bg-slate-200 rounded"></div>
          <div className="w-12 h-3 bg-slate-200 rounded"></div>
        </div>

        <div className="w-3/4 h-5 bg-slate-200 rounded mb-3"></div>

        {/* Chips Skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="w-14 h-4 bg-slate-200 rounded"></div>
          <div className="w-16 h-4 bg-slate-200 rounded"></div>
          <div className="w-12 h-4 bg-slate-200 rounded"></div>
        </div>

        {/* Footer Skeleton */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
          <div>
            <div className="w-24 h-5 bg-slate-200 rounded mb-1"></div>
            <div className="w-12 h-3 bg-slate-100 rounded"></div>
          </div>
          <div className="w-24 h-8 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
