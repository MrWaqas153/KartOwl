import { useState, useEffect, useMemo, useCallback } from 'react';
import { Marketplace, Product, ProductDetail, MarketplaceStatus } from '@/shared/schema';
import Navbar from '@/components/Navbar';
import ModernHero from '@/components/ModernHero';
import MarketplaceShowcase from '@/components/MarketplaceShowcase';
import VerifiedDealsSection from '@/components/VerifiedDealsSection';
import FilterSidebar from '@/components/FilterSidebar';
import ProfessionalProductCard from '@/components/ProfessionalProductCard';
import EnhancedProductDetailModal from '@/components/EnhancedProductDetailModal';
import MarketplaceStatusBanner from '@/components/MarketplaceStatusBanner';

import Footer from '@/components/Footer';
import { searchProducts, getProductHistory } from '@/lib/api';
import { getRandomItems, getRandomItemByCondition } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, Loader2, AlertTriangle, Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Marketplace[]>([
    'daraz', 'telemart', 'priceoye', 'olx'
  ]);

  const [sortBy, setSortBy] = useState('relevance');
  const [showSuspicious, setShowSuspicious] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [products, setProducts] = useState<Product[]>([]); // Real products
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [loadingText, setLoadingText] = useState('Initializing search...'); // Progress indicator

  // Pagination state
  const [displayCount, setDisplayCount] = useState(12); // Show 12 initially
  const LOAD_MORE_INCREMENT = 12;

  // Trending/Initial State
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // New State for Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);

  // Marketplace status tracking
  const [marketplaceStatus, setMarketplaceStatus] = useState<Record<Marketplace, MarketplaceStatus> | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // ON LOAD: Fetch Real Trending Data
  useEffect(() => {
    const fetchTrending = async () => {
      setIsTrendingLoading(true);
      try {
        // 1. Try to get REAL trending data from DB
        const response = await fetch('http://localhost:3000/api/trending');
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setTrendingProducts(data);
        } else {
          // 2. FALLBACK: If DB is empty (first run), keep the old random search logic
          // ... (keep your existing random search code here as backup) ...
          const popularTerms = ['Smart Watches', 'Wireless Earbuds', 'Gaming Headsets', 'Power Banks', 'Bluetooth Speakers']; // etc
          const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];
          const response = await searchProducts(randomTerm);
          // Shuffle the results to make it look more "random"
          const shuffled = response.data.sort(() => 0.5 - Math.random());
          setTrendingProducts(shuffled);
        }
      } catch (e) {
        console.error("Failed to load trending", e);
        // Fallback to random search if API fails
        const popularTerms = ['Smart Watches', 'Wireless Earbuds', 'Gaming Headsets', 'Power Banks', 'Bluetooth Speakers'];
        const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];
        const response = await searchProducts(randomTerm);
        const shuffled = response.data.sort(() => 0.5 - Math.random());
        setTrendingProducts(shuffled);
      } finally {
        setIsTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleMarketplaceToggle = (marketplace: Marketplace) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplace)
        ? prev.filter(m => m !== marketplace)
        : [...prev, marketplace]
    );
  };

  // The new Search Handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // IMMEDIATELY show the results page with loading state
    setHasSearched(true);
    setIsLoading(true);
    setProducts([]);
    setMarketplaceStatus(null);
    setIsRateLimited(false);
    setDisplayCount(12); // Reset pagination for new search

    // simulate progress messages
    const timers = [
      setTimeout(() => setLoadingText('Scraping Daraz...'), 500),
      setTimeout(() => setLoadingText('Checking PriceOye...'), 1500),
      setTimeout(() => setLoadingText('Comparing prices...'), 3000),
    ];

    try {
      const response = await searchProducts(searchQuery);
      setProducts(response.data);
      setMarketplaceStatus(response.marketplaceStatus);

      // Check if rate limited (all marketplaces failed with same error)
      if (!response.success && response.count === 0) {
        setIsRateLimited(true);
      }
    } finally {
      setIsLoading(false);
      timers.forEach(clearTimeout); // Cleanup
    }
  };

  // Go back to home without page reload
  const goHome = useCallback(() => {
    setHasSearched(false);
    setSearchQuery('');
    setProducts([]);
    setMarketplaceStatus(null);
    setIsRateLimited(false);
    setDisplayCount(12);
  }, []);

  // Listen for BottomNav custom events
  useEffect(() => {
    const handleGoHome = () => {
      goHome();
    };

    const handleGoDeals = () => {
      // If in search results, go home first, then scroll to deals section
      if (hasSearched) {
        goHome();
        setTimeout(() => {
          const element = document.getElementById('deals');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        // Already on home page, just scroll
        const element = document.getElementById('deals');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('kartowl:go-home', handleGoHome);
    window.addEventListener('kartowl:go-deals', handleGoDeals);
    return () => {
      window.removeEventListener('kartowl:go-home', handleGoHome);
      window.removeEventListener('kartowl:go-deals', handleGoDeals);
    };
  }, [goHome, hasSearched]);

  const filteredAndSortedProducts = products.filter(product => {
    const matchesMarketplace = selectedMarketplaces.includes(product.marketplace);

    // Since we don't have suspicious data from the backend yet, we'll skip this filter
    // In a real implementation, you'd need to add this logic to your backend

    return matchesMarketplace;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.currentPrice - b.currentPrice;
      case 'price-high':
        return b.currentPrice - a.currentPrice;
      case 'discount':
        // Since we don't have discount data from the backend yet, we'll sort by original price difference
        return (b.originalPrice || 0) - (a.originalPrice || 0);
      default:
        return 0;
    }
  });

  // Logic to find the best discounted product for the ModernHero featured deal
  // MEMOIZED to prevent changes when typing in search bar
  const featuredDealProduct = useMemo(() => {
    if (trendingProducts.length === 0) return null;
    return getRandomItemByCondition(trendingProducts, product =>
      product.discount !== undefined && product.discount > 15 &&
      (product.marketplace === 'daraz' || product.marketplace === 'priceoye')
    ) || trendingProducts[0]; // Fallback to first product if no good discount found
  }, [trendingProducts]); // Only recompute when trendingProducts changes

  const handleProductClick = async (productId: string) => {
    const product = [...products, ...trendingProducts].find(p => p.id === productId);

    if (product) {
      // Open Modal immediately with empty history
      const initialDetail: ProductDetail = {
        ...product,
        fakeSaleStatus: 'genuine',
        description: `Found on ${product.marketplace}...`,
        priceHistory: [],
        averagePrice: product.currentPrice,
        lowestPrice: product.currentPrice,
        highestPrice: product.currentPrice
      };
      setSelectedProduct(initialDetail);

      // Fetch Real History
      try {
        console.log('🔍 Fetching history for:', product.productUrl);
        const historyData = await getProductHistory(product.productUrl);
        console.log('📊 Raw history data received:', historyData);

        if (historyData.length > 0) {
          // MAP 'scrapedAt' to 'date'
          // 👇👇👇 THIS MAPPING IS CRITICAL 👇👇👇
          const formattedHistory = historyData.map((h: any) => ({
            date: h.scrapedAt, // <--- MAP BACKEND 'scrapedAt' TO FRONTEND 'date'
            price: Number(h.price), // Ensure it's a number
            marketplace: h.marketplace
          }));
          // 👆👆👆 THIS MAPPING IS CRITICAL 👆👆👆

          console.log('🔄 Formatted history data:', formattedHistory);

          // Sort by date
          formattedHistory.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // 1. Calculate Stats
          const prices = historyData.map((h: any) => Number(h.price)); // Ensure numbers
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);

          // 2. DYNAMIC STATUS LOGIC (Calculated Here)
          let status: 'genuine' | 'fair' | 'suspicious' = 'fair';

          // If current price is 5% cheaper than average -> Genuine
          if (product.currentPrice < avg * 0.95) {
            status = 'genuine';
          }
          // If current price is 5% more expensive -> Suspicious
          else if (product.currentPrice > avg * 1.05) {
            status = 'suspicious';
          }

          console.log('📈 Final price calculations:', { min, max, avg, prices });
          console.log('📦 Data being sent to modal:', {
            priceHistory: formattedHistory,
            lowestPrice: min,
            highestPrice: max,
            averagePrice: avg
          });

          // 3. Update State with REAL status
          setSelectedProduct(prev => prev ? ({
            ...prev,
            priceHistory: formattedHistory,
            lowestPrice: min,
            highestPrice: max,
            averagePrice: avg,
            fakeSaleStatus: status // <--- Using the calculated variable
          }) : null);
        }
      } catch (e) {
        console.error("Could not update price history", e);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        onGoHome={goHome}
      />

      {!hasSearched && (
        <>
          <ModernHero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            featuredDeal={featuredDealProduct}
            isLoading={isLoading || isTrendingLoading}
          />



          <MarketplaceShowcase />

          <VerifiedDealsSection onViewDetails={setSelectedProductId} />
        </>
      )}

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {hasSearched && (
            <div className="flex gap-6">
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <FilterSidebar
                    selectedMarketplaces={selectedMarketplaces}
                    onMarketplaceToggle={handleMarketplaceToggle}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    showSuspicious={showSuspicious}
                    onShowSuspiciousChange={setShowSuspicious}
                  />
                </div>
              </aside>

              <div className="flex-1 space-y-6">

                {/* Mobile Search Bar - Visible only on mobile/tablet when in results mode */}
                <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur pb-4 pt-2 -mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 bg-muted/50 border-input/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                      {isLoading ? `Searching for "${searchQuery}"...` : searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Found <span className="font-semibold text-primary">{filteredAndSortedProducts.length}</span> products across {selectedMarketplaces.length} marketplaces
                    </p>
                  </div>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden" data-testid="button-open-filters">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters & Sort
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filters & Sort</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <FilterSidebar
                          selectedMarketplaces={selectedMarketplaces}
                          onMarketplaceToggle={handleMarketplaceToggle}
                          sortBy={sortBy}
                          onSortChange={setSortBy}
                          showSuspicious={showSuspicious}
                          onShowSuspiciousChange={setShowSuspicious}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Rate Limiting Warning */}
                {isRateLimited && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div>
                        <h4 className="font-semibold text-red-800">Too many requests</h4>
                        <p className="text-sm text-red-700">
                          Please wait a moment before searching again. Rate limiting is in effect.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Marketplace Status Banner */}
                {!isLoading && marketplaceStatus && (
                  <MarketplaceStatusBanner marketplaceStatus={marketplaceStatus} />
                )}

                {/* LOADING STATE: Skeleton Cards */}
                {/* LOADING STATE: Progress Indicator */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-brand-purple animate-spin mb-4" />
                    <h3 className="text-xl font-bold animate-pulse">{loadingText}</h3>
                    <p className="text-slate-500">Scanning live markets...</p>
                  </div>
                )}


                {/* REAL DATA STATE */}
                {!isLoading && filteredAndSortedProducts.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                      {filteredAndSortedProducts.slice(0, displayCount).map(product => (
                        <ProfessionalProductCard
                          key={product.id}
                          product={product}
                          onViewDetails={handleProductClick}
                        />
                      ))}
                    </div>

                    {/* Load More Button */}
                    {displayCount < filteredAndSortedProducts.length && (
                      <div className="flex justify-center mt-8">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setDisplayCount(prev => prev + LOAD_MORE_INCREMENT)}
                          className="px-8"
                        >
                          Load More ({filteredAndSortedProducts.length - displayCount} remaining)
                        </Button>
                      </div>
                    )}

                    {/* Show count indicator */}
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Showing {Math.min(displayCount, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
                    </p>
                  </>
                )}

                {/* EMPTY STATE */}
                {!isLoading && filteredAndSortedProducts.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters or search for something else
                    </p>
                    <Button onClick={() => {
                      setSearchQuery('');
                      setHasSearched(false);
                    }}>
                      Back to Home
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasSearched && (
            <section id="deals" className="py-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                    Trending Deals
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground">Popular products with the best prices right now</p>
              </div>

              {isTrendingLoading ? (
                // Skeleton Loader
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[350px] bg-white rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                  {/* Show top 20 random products */}
                  {getRandomItems(trendingProducts, 20).map(product => (
                    <ProfessionalProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={handleProductClick}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* The Pop-up Page (Modal) */}
      <EnhancedProductDetailModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </div>
  );
}
