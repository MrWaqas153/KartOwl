import { Link } from 'wouter';

const marketplaceLinks = [
  { name: 'Daraz', url: 'https://www.daraz.pk' },
  { name: 'OLX', url: 'https://www.olx.com.pk' },
  { name: 'Telemart', url: 'https://www.telemart.pk' },
  { name: 'PriceOye', url: 'https://priceoye.pk' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <img
              src="/kartowl-logo.png"
              alt="KartOwl Logo"
              className="h-10 w-auto"
            />
            <p className="text-sm text-muted-foreground">
              Your trusted price comparison platform for Pakistani marketplaces.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Marketplaces</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {marketplaceLinks.map(mp => (
                <li key={mp.name}>
                  <a
                    href={mp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors"
                  >
                    {mp.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">About Us</Link></li>
              <li><Link href="/how-it-works" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">How It Works</Link></li>
              <li><Link href="/how-we-earn" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">How We Earn</Link></li>
              <li><Link href="/contact" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">Terms of Service</Link></li>
              <li><Link href="/affiliate-disclosure" className="hover-elevate hover:text-primary px-1 py-0.5 rounded transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} KartOwl. All rights reserved.</p>
          <p className="mt-2">
            We earn affiliate commissions from marketplace links. Prices may vary.
          </p>
        </div>
      </div>
    </footer>
  );
}
