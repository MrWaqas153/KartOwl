import { Home as HomeIcon, Search, ShoppingBag } from 'lucide-react';

export default function BottomNav() {

  const handleHomeClick = () => {
    // Dispatch a custom event so Home.tsx can reset search state
    window.dispatchEvent(new CustomEvent('kartowl:go-home'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchClick = () => {
    // Scroll to top so the navbar search bar is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Try to focus the search input
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="input-navbar-search"]');
      if (input) input.focus();
    }, 300);
  };

  const handleDealsClick = () => {
    // Dispatch a custom event so Home.tsx can go home first, then scroll
    window.dispatchEvent(new CustomEvent('kartowl:go-deals'));
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50">
      <div className="flex justify-around items-center py-2 px-4 safe-area-bottom">
        {/* Home Button - No permanent active state */}
        <button
          onClick={handleHomeClick}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] text-slate-500 active:text-brand-purple active:scale-95"
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearchClick}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] text-slate-500 active:text-brand-purple active:scale-95"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        {/* Deals Button */}
        <button
          onClick={handleDealsClick}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] text-slate-500 active:text-brand-purple active:scale-95"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium">Deals</span>
        </button>
      </div>
    </div>
  );
}