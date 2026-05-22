import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function PriceAlertDialog({ productUrl, currentPrice }: { productUrl: string, currentPrice: number }) {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    // 1. Regex Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    // 2. Send to Backend
    try {
      // YAHAN RAILWAY KA LIVE LINK UPDATE KAR DIYA HAI 👇
      const res = await fetch('https://kartowl-production-8370.up.railway.app/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productUrl, targetPrice: Number(targetPrice) })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Failed to set alert');

      if (data.emailSent) {
        toast({ title: "Alert set!", description: "Check your inbox for confirmation." });
      } else {
        toast({
          title: "Alert saved",
          description: "Email confirmation could not be sent, but your price alert is active.",
        });
      }
      setOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to set alert", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-brand-purple text-brand-purple hover:bg-brand-purple/10">
          <BellRing className="w-4 h-4" /> Set Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notify me when price drops</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Price (Rs)</label>
            <Input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <p className="text-xs text-gray-500">We'll send you a confirmation email</p>
          </div>
          <Button onClick={handleSubscribe} className="w-full bg-brand-purple">Set Alert</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
