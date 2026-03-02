'use client';
type Props = {
    page: number;
    setPage: (p: number) => void;
    totalPages: number;
    totalItems: number;
    limit?: number;
    className?: string;
};

export default function Pagination({ page, setPage, totalPages, totalItems, limit = 10, className = '' }: Props) {
    const safeTotalPages = Math.max(1, totalPages || 1);
    const start = totalItems === 0 ? 0 : (page - 1) * limit + 1;
    const end = totalItems === 0 ? 0 : Math.min(page * limit, totalItems);

    return (
        <div
            className={`mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 ${className}`}
        >
            <div className="text-sm text-gray-600">Showing {start} - {end} of {totalItems}</div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="rounded border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed"
                >Prev</button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: safeTotalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setPage(idx + 1)}
                            className={`cursor-pointer px-3 py-1 rounded ${page === idx + 1 ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
                        >{idx + 1}</button>
                    ))}
                </div>

                <button
                    onClick={() => setPage(Math.min(safeTotalPages, page + 1))}
                    disabled={page >= safeTotalPages}
                    className="rounded border border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed"
                >Next</button>
            </div>
        </div>
    );
}
