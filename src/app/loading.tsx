export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
            <div className="text-center">
                <div className="spinner mx-auto mb-6"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Sedang Memuat...
                </h2>
                <p className="text-gray-500">Mohon tunggu sebentar</p>
            </div>
        </div>
    );
}
