'use client';
type Props = {
    page: number;
    setPage: (p: number) => void;
    totalPages: number;
    totalItems: number;
    limit?: number;
    setLimit?: (n: number) => void;
    limitOptions?: readonly number[];
    className?: string;
};

const ELLIPSIS = '...';

function getPaginationItems(currentPage: number, totalPages: number): Array<number | typeof ELLIPSIS> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, ELLIPSIS, totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, ELLIPSIS, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, ELLIPSIS, currentPage - 1, currentPage, currentPage + 1, ELLIPSIS, totalPages];
}

export default function Pagination({
    page,
    setPage,
    totalPages,
    totalItems,
    limit = 10,
    setLimit,
    limitOptions = [10, 25, 50, 100],
    className = '',
}: Props) {
    const safeTotalPages = Math.max(1, totalPages || 1);
    const safePage = Math.min(Math.max(page || 1, 1), safeTotalPages);
    const start = totalItems === 0 ? 0 : (safePage - 1) * limit + 1;
    const end = totalItems === 0 ? 0 : Math.min(safePage * limit, totalItems);
    const paginationItems = getPaginationItems(safePage, safeTotalPages);

    return (
        <div
            className={`mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between ${className}`}
        >
            <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-gray-600">Showing {start} - {end} of {totalItems}</div>
                {setLimit && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Page size</span>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                        >
                            {limitOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    className="rounded border cursor-pointer border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed"
                >Prev</button>

                <div className="flex items-center gap-1">
                    {paginationItems.map((item, index) =>
                        item === ELLIPSIS ? (
                            <span key={`ellipsis-${index}`} className="px-1 text-slate-500">
                                ...
                            </span>
                        ) : (
                            <button
                                key={item}
                                onClick={() => setPage(item)}
                                className={`rounded cursor-pointer border px-3 py-1 font-medium transition-colors ${
                                    safePage === item
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                {item}
                            </button>
                        ),
                    )}
                </div>

                <button
                    onClick={() => setPage(Math.min(safeTotalPages, safePage + 1))}
                    disabled={safePage >= safeTotalPages}
                    className="rounded border cursor-pointer border-slate-300 bg-white px-3 py-1 text-slate-700 disabled:cursor-not-allowed"
                >Next</button>
            </div>
        </div>
    );
}
