import { PriceHistory } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

interface PriceHistoryChartProps {
  priceHistory: PriceHistory[];
  currentPrice: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
}

export default function PriceHistoryChart({
  priceHistory,
  currentPrice,
  averagePrice,
  lowestPrice,
  highestPrice
}: PriceHistoryChartProps) {
  
  // DEBUG: Log incoming data to help diagnose issues
  console.log('📊 PriceHistoryChart received:', {
    priceHistoryLength: priceHistory?.length,
    priceHistorySample: priceHistory?.[0],
    currentPrice,
    averagePrice
  });
  
  // 1. DATA PREPARATION WITH VALIDATION
  // Safely parse dates and ensure numbers, with fallbacks
  let displayData = (priceHistory || [])
    .filter(item => item && item.date && item.price !== undefined) // Filter out invalid entries
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Number(item.price),
      average: Number(averagePrice)
    }))
    .filter(item => !isNaN(item.price) && item.date !== 'Invalid Date'); // Extra validation

  // 2. THE FLAT LINE FIX: If only 1 point, duplicate it to yesterday
  if (displayData.length === 1) {
    const singlePoint = displayData[0];
    
    // Safety check for date - use the original date string for better reliability
    const originalDateStr = priceHistory[0]?.date || new Date().toISOString();
    const yesterday = new Date(originalDateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayFormatted = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Only add yesterday's point if it's a valid date
    if (yesterdayFormatted !== 'Invalid Date') {
      displayData.unshift({
        date: yesterdayFormatted,
        price: singlePoint.price,
        average: singlePoint.average
      });
    }
  }

  // 3. ULTIMATE FALLBACK: If still no valid data, create a dummy point
  if (displayData.length === 0 && priceHistory?.length > 0) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    displayData = [{
      date: yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Number(currentPrice) || 0,
      average: Number(averagePrice) || 0
    }];
  }

  // 3. EMPTY STATE
  if (displayData.length === 0) {
      return (
        <Card className="h-full flex items-center justify-center bg-slate-50 border-none shadow-none">
            <div className="text-center text-slate-400 p-6">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                <p>Tracking started just now.<br/>History will appear tomorrow.</p>
            </div>
        </Card>
      );
  }

  return (
    <Card data-testid="card-price-history" className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Price History (Last 3 Months)</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current</p>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">₨{currentPrice.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Average</p>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">₨{averagePrice.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-green-600 uppercase tracking-wider font-semibold">Lowest</p>
            <p className="text-xl font-bold font-mono text-green-600">₨{lowestPrice.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Highest</p>
            <p className="text-xl font-bold font-mono text-red-600">₨{highestPrice.toLocaleString()}</p>
          </div>
        </div>
        
        {/* CHART CONTAINER */}
        <div className="h-[220px] sm:h-[300px] w-full bg-white dark:bg-slate-900/50 rounded-xl p-1 sm:p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
              
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                dy={8}
                interval="preserveStartEnd"
              />
              
              {/* CRITICAL FIX: Custom Domain to prevent flat-line collapse */}
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={35}
                domain={[
                  (dataMin: number) => (dataMin * 0.95), // Add 5% padding below
                  (dataMax: number) => (dataMax * 1.05)  // Add 5% padding above
                ]}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [`₨${value.toLocaleString()}`, 'Price']}
                labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
              />
              
              <Legend verticalAlign="bottom" height={36}/>
              
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={1500}
                name="Price"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
