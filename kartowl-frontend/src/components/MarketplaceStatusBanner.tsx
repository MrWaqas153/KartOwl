import { Marketplace, MarketplaceStatus } from '@/shared/schema';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MarketplaceStatusBannerProps {
    marketplaceStatus: Record<Marketplace, MarketplaceStatus>;
}

const marketplaceConfig: Record<Marketplace, { name: string; color: string }> = {
    daraz: { name: 'Daraz', color: 'bg-orange-500' },
    priceoye: { name: 'PriceOye', color: 'bg-green-500' },
    telemart: { name: 'Telemart', color: 'bg-blue-500' },
    olx: { name: 'OLX', color: 'bg-cyan-500' },
};

export default function MarketplaceStatusBanner({ marketplaceStatus }: MarketplaceStatusBannerProps) {
    const marketplaces = Object.entries(marketplaceStatus) as [Marketplace, MarketplaceStatus][];

    return (
        <div className="mb-6">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
                {marketplaces.map(([marketplace, status]) => (
                    <div
                        key={marketplace}
                        className={`
                            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                            ${status.success
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-red-50 text-red-700 border border-red-200'}
                        `}
                    >
                        <span className={`w-2 h-2 rounded-full ${marketplaceConfig[marketplace].color}`} />
                        <span>{marketplaceConfig[marketplace].name}</span>
                        {status.success ? (
                            <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">{status.count}</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-red-500">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs">Failed</span>
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}