'use client';

type ListSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function GridSkeleton({ rows = 6 }: ListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 h-5 w-2/5 rounded-md shimmer" />
          <div className="mb-2 h-3.5 w-full rounded-md shimmer" />
          <div className="mb-2 h-3.5 w-4/5 rounded-md shimmer" />
          <div className="h-3.5 w-1/2 rounded-md shimmer" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 6 }: ListSkeletonProps) {
  const widthByIndex = (index: number) => {
    const variants = ['w-full', 'w-11/12', 'w-4/5', 'w-3/4'];
    return variants[index % variants.length];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
      <div
        className="mb-4 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className={`h-3.5 rounded-md shimmer ${widthByIndex(idx)}`} />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid items-center gap-3 rounded-lg px-1 py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`h-3.5 rounded-md shimmer ${widthByIndex(rowIdx + colIdx)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
