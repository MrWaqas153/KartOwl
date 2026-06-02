import { Marketplace, MarketplaceStatus } from '@/shared/schema';

interface MarketplaceStatusBannerProps {
    marketplaceStatus: Record<Marketplace, MarketplaceStatus>;
}

export default function MarketplaceStatusBanner({ marketplaceStatus }: MarketplaceStatusBannerProps) {
    return null;
}