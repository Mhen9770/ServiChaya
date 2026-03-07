'use client'

export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-background rounded ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden">
      <div className="animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-neutral-border last:border-0">
            <div className="h-14 bg-neutral-background" />
          </div>
        ))}
      </div>
    </div>
  )
}
