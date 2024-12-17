const ProductCardSkeleton = () => {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 animate-pulse">
            <div className="w-full h-48 bg-gray-300 rounded-md mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
    );
};

export default ProductCardSkeleton;

