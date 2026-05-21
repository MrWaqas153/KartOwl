import { Search, Menu, ShoppingBag, TrendingDown, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Link } from 'wouter';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import { useState } from 'react';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: () => void;
  isLoading?: boolean;
  onGoHome?: () => void; // Navigate to home without page reload
}

export default function Navbar({ searchQuery = '', onSearchChange, onSearch, isLoading = false, onGoHome }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.();
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: ShoppingBag },
    { href: '#deals', label: 'Hot Deals', icon: TrendingDown },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <div
            className="flex items-center hover-elevate px-3 py-2 rounded-md -ml-3 cursor-pointer"
            onClick={() => onGoHome ? onGoHome() : window.location.reload()}
            data-testid="link-home"
          >
            <img
              src="/kartowl-logo.png"
              alt="KartOwl Logo"
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return link.href === '/' ? (
                <div
                  key={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-md hover-elevate text-sm font-medium cursor-pointer"
                  onClick={() => onGoHome ? onGoHome() : window.location.reload()}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </div>
              ) : link.href === '#deals' ? (
                <div
                  key={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-md hover-elevate text-sm font-medium cursor-pointer"
                  onClick={() => {
                    window.location.hash = '';
                    setTimeout(() => {
                      const element = document.getElementById('deals');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 10);
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </div>
              ) : (
                <Link key={link.href} href={link.href}>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-md hover-elevate text-sm font-medium cursor-pointer">
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Search products across all marketplaces..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10 pr-4 h-10 bg-muted/50"
                  data-testid="input-navbar-search"
                />
              </div>
            </form>

            {/* Desktop Search Button */}
            <Button
              onClick={onSearch}
              className="hidden md:flex"
              data-testid="button-navbar-search"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-4 mt-8">
                  <form onSubmit={handleSubmit} className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button className="w-full mt-2" type="submit" disabled={isLoading || !searchQuery.trim()}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </form>

                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      return link.href === '/' ? (
                        <div
                          key={link.href}
                          className="flex items-center gap-3 px-4 py-3 rounded-md hover-elevate text-base font-medium cursor-pointer"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onGoHome ? onGoHome() : window.location.reload();
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          {link.label}
                        </div>
                      ) : link.href === '#deals' ? (
                        <div
                          key={link.href}
                          className="flex items-center gap-3 px-4 py-3 rounded-md hover-elevate text-base font-medium cursor-pointer"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            window.location.hash = '';
                            setTimeout(() => {
                              const element = document.getElementById('deals');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 10);
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          {link.label}
                        </div>
                      ) : (
                        <Link key={link.href} href={link.href}>
                          <div
                            className="flex items-center gap-3 px-4 py-3 rounded-md hover-elevate text-base font-medium cursor-pointer"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="w-5 h-5" />
                            {link.label}
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}