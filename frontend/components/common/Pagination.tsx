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
    if (totalItems === 0) {
        return <div className="text-sm text-gray-600">No items</div>;
    }

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalItems);

    return (
        <div className={`flex items-center justify-between mt-4 ${className}`}>
            <div className="text-sm text-gray-600">Showing {start} - {end} of {totalItems}</div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={`px-3 cursor-pointer py-1 rounded ${page <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-white border'}`}
                >Prev</button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setPage(idx + 1)}
                            className={`cursor-pointer px-3 py-1 rounded ${page === idx + 1 ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
                        >{idx + 1}</button>
                    ))}
                </div>

                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className={`px-3 py-1 cursor-pointer rounded ${page >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white border'}`}
                >Next</button>
            </div>
        </div>
    );
}
