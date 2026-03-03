'use client';

type TopLoaderProps = {
  loading: boolean;
};

export default function TopLoader({ loading }: TopLoaderProps) {
  return (
    <div className="fixed left-0 right-0 top-0 z-70 h-1 overflow-hidden bg-transparent">
      <div
        className={`h-full bg-linear-to-r from-indigo-500 via-sky-500 to-teal-400 transition-opacity duration-200 ${
          loading ? 'opacity-100 animate-top-loader' : 'opacity-0'
        }`}
      />
    </div>
  );
}
