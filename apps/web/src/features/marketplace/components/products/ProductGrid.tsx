'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Grid, List, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard, Product } from './ProductCard';
import { ProductFilters } from './ProductFilters';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  totalProducts: number;
  currentPage: number;
  productsPerPage?: number;
  onPageChange: (page: number) => void;
  onSortChange?: (sort: string) => void;
  onFilterChange?: (filters: any) => void;
  showFilters?: boolean;
  loading?: boolean;
  gridCols?: 2 | 3 | 4;
  viewMode?: 'grid' | 'list';
}

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'bestseller', label: 'Best Sellers' }
];

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  totalProducts,
  currentPage,
  productsPerPage = 12,
  onPageChange,
  onSortChange,
  onFilterChange,
  showFilters = true,
  loading = false,
  gridCols = 4,
  viewMode: initialViewMode = 'grid'
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [selectedSort, setSelectedSort] = useState('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSortChange?.(value);
  };

  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product);
    // Implement cart logic
  };

  const handleAddToWishlist = (product: Product) => {
    console.log('Add to wishlist:', product);
    // Implement wishlist logic
  };

  const handleQuickView = (product: Product) => {
    console.log('Quick view:', product);
    // Implement quick view modal
  };

  const getGridClass = () => {
    if (viewMode === 'list') return 'space-y-4';
    
    const gridClasses = {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };
    
    return `grid gap-4 ${gridClasses[gridCols]}`;
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-2 text-sm border rounded-lg transition-colors",
              currentPage === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Mobile Filters Overlay */}
      {showFilters && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
            mobileFiltersOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        {showFilters && desktopFiltersOpen && (
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <ProductFilters onFilterChange={onFilterChange} />
            </div>
          </div>
        )}

        {/* Mobile Filters Drawer */}
        {showFilters && (
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:hidden transition-transform",
              mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              <ProductFilters onFilterChange={onFilterChange} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Toggle */}
              {showFilters && (
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              )}

              {/* Desktop Filter Toggle */}
              {showFilters && (
                <button
                  onClick={() => setDesktopFiltersOpen(!desktopFiltersOpen)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {desktopFiltersOpen ? 'Hide' : 'Show'} Filters
                </button>
              )}

              {/* Results Count */}
              <p className="text-sm text-gray-600">
                Showing {Math.min(productsPerPage * (currentPage - 1) + 1, totalProducts)}-
                {Math.min(productsPerPage * currentPage, totalProducts)} of {totalProducts} products
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid'
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                  title="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list'
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <div className={getGridClass()}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={viewMode}
                    onAddToCart={handleAddToCart}
                    onAddToWishlist={handleAddToWishlist}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};