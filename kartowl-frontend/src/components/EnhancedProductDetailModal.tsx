import { ProductDetail } from '@shared/schema';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Share2, ExternalLink, TrendingUp, AlertTriangle } from 'lucide-react';
import PriceHistoryChart from './PriceHistoryChart';
import PriceAlertDialog from './PriceAlertDialog';

interface EnhancedProductDetailModalProps {
  product: ProductDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EnhancedProductDetailModal({ product, open, onOpenChange }: EnhancedProductDetailModalProps) {
  if (!product) return null;

  // Sirf wahi data use ho raha hai jo backend database se bhej raha hai
  const {
    priceHistory,
    currentPrice,
    originalPrice,
    averagePrice,
    lowestPrice,
    highestPrice,
    fakeSaleStatus,
    marketplace,
    title,
    image,
    productUrl,
    reviews,
    description,
    priceText,
    discount
  } = product;

  const hasDiscount = originalPrice && originalPrice > currentPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-none shadow-2xl w-[95vw] sm:w-auto">
        <div className="flex flex-col md:flex-row max-h-[92vh] md:h-[80vh] overflow-y-auto md:overflow-hidden">

          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-10 scrollbar-hide">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 sm:p-8 mb-6 flex items-center justify-center">
              <img
                src={image}
                alt={title}
                className="max-h-[160px] sm:max-h-[300px] object-contain mix-blend-multiply dark:mix-blend-normal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-slate-500 text-xs mb-1">Lowest Price (Database)</div>
                <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  ₨{lowestPrice.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-slate-500 text-xs mb-1">Sale Analysis</div>
                {fakeSaleStatus === 'suspicious' ? (
                  <Badge variant="destructive" className="mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> FAKE SALE DETECTED
                  </Badge>
                ) : (
                  <Badge variant="default" className="mt-1 bg-green-500">
                    REAL PRICE
                  </Badge>
                )}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Real-time Price History</h3>
              {/* Yeh chart ab wahi dikhayega jo database mein save ho chuka hai */}
              <PriceHistoryChart
                priceHistory={priceHistory || []}
                currentPrice={currentPrice}
                averagePrice={averagePrice}
                lowestPrice={lowestPrice}
                highestPrice={highestPrice}
              />

              {description && (
                <p className="text-sm text-slate-600 leading-relaxed mt-6">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="w-full md:w-[380px] lg:w-[400px] bg-white dark:bg-slate-950 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col z-20">
            <div className="mb-auto">
              <Badge variant="outline" className="mb-4 uppercase">{marketplace}</Badge>
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-amber-400">★★★★☆</div>
                <span className="text-sm text-slate-400">({reviews} reviews)</span>
              </div>
            </div>

            <div className="space-y-6 mt-6">
              <Separator />
              <div>
                <div className="flex items-end gap-3 mb-1">
                  <span className="text-4xl font-extrabold text-brand-purple">
                    {marketplace === 'olx' && priceText
                      ? priceText.replace(/^Rs\.?\s*/, '₨')
                      : `₨${currentPrice.toLocaleString()}`
                    }
                  </span>
                  {marketplace !== 'olx' && originalPrice && originalPrice > currentPrice && (
                    <span className="text-lg text-slate-400 line-through mb-1">
                      ₨{originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <PriceAlertDialog productUrl={productUrl} currentPrice={currentPrice} />
                <Button
                  className="w-full h-14 text-lg bg-slate-900 hover:bg-brand-purple text-white rounded-xl"
                  onClick={() => window.open(productUrl, '_blank')}
                >
                  Go to Store <ExternalLink className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}