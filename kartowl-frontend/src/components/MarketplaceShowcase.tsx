import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface Marketplace {
  name: string;
  description: string;
  color: string;
  image?: string;
}

const marketplaces: Marketplace[] = [
  {
    name: 'Daraz',
    description: 'Pakistan\'s largest online marketplace',
    color: 'from-black-500 to-black-600',
    image: '/daraz-logo.png'
  },
  {
    name: 'OLX',
    description: 'Local classified ads and marketplace',
    color: 'from-black-500 to-black-600',
    image: '/olx-logo.png'
  },
  {
    name: 'Telemart',
    description: 'Electronics and gadgets specialist',
    color: 'from-black-500 to-black-600',
    image: '/telemart-logo.png'
  },
  {
    name: 'PriceoYe',
    description: 'Best prices on tech products',
    color: 'from-black-500 to-black-600',
    image: '/priceoye-logo.png'
  }
];

export default function MarketplaceShowcase() {
  return (
    <section className="py-6 sm:py-12 md:py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 sm:mb-12">
          <Badge className="mb-2 sm:mb-4 text-xs" variant="outline">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Trusted Marketplaces
          </Badge>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Compare Prices Across 4+ Marketplaces
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            We search all major Pakistani online stores to find you the best deals
          </p>
        </div>

        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-5xl mx-auto overflow-x-auto pb-4 sm:pb-0 -mx-4 px-4 sm:mx-auto sm:px-0 snap-x snap-mandatory">
          {marketplaces.map((marketplace, index) => (
            <Card
              key={marketplace.name}
              className="group hover-elevate active-elevate-2 transition-all cursor-pointer overflow-hidden flex-shrink-0 w-[140px] sm:w-auto snap-start"
              data-testid={`card-marketplace-${marketplace.name.toLowerCase()}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-3 sm:p-6 text-center space-y-2 sm:space-y-4">
                <div className={`w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br ${marketplace.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  {marketplace.image ? (
                    <img
                      src={marketplace.image}
                      alt={`${marketplace.name} Logo`}
                      className="w-6 h-6 sm:w-10 sm:h-10 object-contain"
                    />
                  ) : (
                    <div className="text-lg sm:text-2xl font-bold text-white">
                      {marketplace.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1">{marketplace.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{marketplace.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hide on mobile, show on tablet+ */}
        <div className="hidden sm:block mt-8 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary/10 rounded-full text-sm sm:text-base">
            <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            <span className="font-medium">Real-time price tracking • Historical data • Fake sale detection</span>
          </div>
        </div>
      </div>
    </section>
  );
}

