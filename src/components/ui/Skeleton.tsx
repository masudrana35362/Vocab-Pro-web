import React from "react";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-0 w-full">
      <Skeleton className="h-10 w-64 mb-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-32 rounded-2xl w-full" />
        <Skeleton className="h-32 rounded-2xl w-full" />
        <Skeleton className="h-32 rounded-2xl w-full" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="flex items-end justify-between h-48 pt-4 space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <Skeleton className="w-10 h-32 rounded-t-lg mt-auto" />
              <Skeleton className="h-4 w-8 mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
