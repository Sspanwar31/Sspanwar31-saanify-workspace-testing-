'use client';

import { useState, useEffect, use } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, MoreVertical, Trash2, 
  Building2, CreditCard, TrendingUp, AlertTriangle, 
  Calendar, CheckCircle, BarChart3, Download, Eye, 
  Bell, History, Lock, Unlock, FileText, Send, 
  MessageSquare, Smartphone, Loader2, Plus, Activity // <--- ADDED HERE
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

// Mock Plan Limits
const PLAN_DETAILS: any = {
  'TRIAL': { limit: 100, price: 0 },
  'BASIC': { limit: 200, price: 4000 },
  'PRO': { limit: 2000, price: 7000 },
  'ENTERPRISE': { limit: 10000, price: 10000 }
};

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { clients, updateClientStatus, deleteClient, refreshDashboard } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);

  // MODAL STATES
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false); // Renamed from PaymentHistory to match intent
  
  // LOGIC STATES
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ email: true, sms: false, whatsapp: false });

  useEffect(() => {
    setIsMounted(true);
    refreshDashboard();
  }, []);

  const client = clients.find(c => c.id.toString() === id);

  if (!isMounted) return <div className="p-8">Loading...</div>;
  if (!client) return <div className="p-8">Client not found</div>;

  // Logic & Calculations
  const maxMembers = PLAN_DETAILS[client.plan]?.limit || 200;
  const usagePercent = Math.min(100, (client.members / maxMembers) * 100);
  const riskLevel = client.status === 'LOCKED' ? 'High' : 'Low';
  const riskColor = riskLevel === 'High' ? 'text-red-600' : 'text-emerald-600';
  const healthScore = client.status === 'ACTIVE' ? 92 : 45;

  // Mock Payment Data
  const paymentHistory = [
    { id: 'INV-2024-001', date: '2025-12-14', amount: '₹7,000', status: 'Paid' },
    { id: 'INV-2023-012', date: '2025-11-14', amount: '₹7,000', status: 'Paid' },
    { id: 'INV-2023-011', date: '2025-10-14', amount: '₹7,000', status: 'Paid' },
  ];

  // --- HANDLERS ---

  const handleSimulatePayment = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setIsRenewOpen(false);
      toast.success(`Plan upgraded to ${selectedPlan} successfully!`);
      // Here you would call updateClient in store to actually change the plan
    }, 2000);
  };

  const handleSendMessage = () => {
    const activeChannels = Object.keys(channels).filter(k => channels[k as keyof typeof channels]).join(', ');
    toast.success(`Message sent via: ${activeChannels.toUpperCase()}`);
    setIsNotifyOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-blue-600" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
        
        <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex gap-5">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-200">
                 {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                 <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{client.name}</h1>
                 <div className="flex flex-wrap items-center gap-4 text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5 text-sm bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><User className="w-3.5 h-3.5 text-blue-500"/> Admin</span>
                    <span className="flex items-center gap-1.5 text-sm bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Mail className="w-3.5 h-3.5 text-orange-500"/> {client.email}</span>
                    <span className="flex items-center gap-1.5 text-sm bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Phone className="w-3.5 h-3.5 text-green-500"/> {client.phone || '+91 98765 43210'}</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                 <Badge className={`px-3 py-1 ${client.status==='ACTIVE'?'bg-emerald-100 text-emerald-700': 'bg-red-100 text-red-700'}`}>{client.status}</Badge>
                 <Badge variant="outline" className="border-blue-200 text-blue-700 px-3 py-1">{client.plan} PLAN</Badge>
              </div>
              <div className="flex gap-2">
                 <Button onClick={() => window.open('/client/dashboard', '_blank')} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200">
                    <Eye className="mr-2 h-4 w-4"/> Access Panel
                 </Button>
                 
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full border border-slate-200 hover:bg-slate-100"><MoreVertical className="h-5 w-5 text-slate-600"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                       <DropdownMenuLabel>Smart Actions</DropdownMenuLabel>
                       <DropdownMenuItem onClick={() => setIsNotifyOpen(true)} className="cursor-pointer"><Bell className="mr-2 h-4 w-4 text-blue-600"/> Notify Client</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setIsLedgerOpen(true)} className="cursor-pointer"><History className="mr-2 h-4 w-4 text-purple-600"/> Statement & Ledger</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setIsRenewOpen(true)} className="cursor-pointer"><CreditCard className="mr-2 h-4 w-4 text-green-600"/> Renew / Change Plan</DropdownMenuItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={() => updateClientStatus(client.id, client.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED')}>
                          {client.status === 'LOCKED' ? <Unlock className="mr-2 h-4 w-4 text-green-600"/> : <Lock className="mr-2 h-4 w-4 text-orange-600"/>}
                          {client.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>
           </div>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="border-l-4 border-l-blue-500 shadow-sm"><CardContent className="p-5"><p className="text-xs text-slate-400 uppercase font-bold">Total Members</p><div className="flex justify-between items-center mt-2"><span className="text-3xl font-bold text-slate-800">{client.members}</span></div></CardContent></Card>
         <Card className="border-l-4 border-l-purple-500 shadow-sm"><CardContent className="p-5"><p className="text-xs text-slate-400 uppercase font-bold">Active Loans</p><div className="flex justify-between items-center mt-2"><span className="text-3xl font-bold text-slate-800">{client.loans}</span></div></CardContent></Card>
         <Card className="border-l-4 border-l-emerald-500 shadow-sm"><CardContent className="p-5"><p className="text-xs text-slate-400 uppercase font-bold">Revenue</p><div className="flex justify-between items-center mt-2"><span className="text-3xl font-bold text-slate-800">₹{client.revenue.toLocaleString()}</span></div></CardContent></Card>
         <Card className={`border-l-4 ${riskLevel === 'High' ? 'border-l-red-500' : 'border-l-orange-500'} shadow-sm`}><CardContent className="p-5"><p className="text-xs text-slate-400 uppercase font-bold">Risk Level</p><div className="flex justify-between items-center mt-2"><span className={`text-3xl font-bold ${riskColor}`}>{riskLevel}</span></div></CardContent></Card>
      </div>

      {/* 3. SUBSCRIPTION & HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="border-b pb-4">
               <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-500"/> Subscription Status</CardTitle>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setIsRenewOpen(true)}>Renew Plan</Button>
               </div>
            </CardHeader>
            <CardContent className="p-6">
               <div className="flex justify-between items-center mb-6">
                  <div><p className="text-sm text-slate-500 font-medium">Current Plan</p><p className="text-2xl font-bold text-indigo-700">{client.plan}</p></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Renewal Date</p><p className="text-xl font-bold text-slate-800">{new Date(client.subscriptionEndsAt).toLocaleDateString()}</p></div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600"><span>Member Usage</span><span className={usagePercent > 90 ? "text-red-600" : ""}>{client.members} / {maxMembers === 10000 ? '∞' : maxMembers} Used</span></div>
                  <Progress value={usagePercent} className="h-3 rounded-full bg-slate-100" />
               </div>
            </CardContent>
         </Card>
         <Card className="shadow-sm flex flex-col">
            <CardHeader className="border-b pb-4"><CardTitle className="text-base font-bold flex items-center gap-2"><Activity className="h-4 w-4 text-slate-500"/> Account Health</CardTitle></CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center gap-6">
               <div className="flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Overall Score</p><h3 className="text-3xl font-bold text-emerald-600">{healthScore}/100</h3></div>
                  <div className="h-12 w-12 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-50"><CheckCircle className="h-6 w-6 text-emerald-600" /></div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* 4. BILLING HISTORY TABLE */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4"><CardTitle className="text-base font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500"/> Recent Invoices</CardTitle></CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Invoice ID</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Download</TableHead></TableRow></TableHeader>
             <TableBody>
                {paymentHistory.map(inv => (
                  <TableRow key={inv.id}>
                     <TableCell>{inv.date}</TableCell>
                     <TableCell>{inv.id}</TableCell>
                     <TableCell>{inv.amount}</TableCell>
                     <TableCell><Badge className="bg-green-100 text-green-700">{inv.status}</Badge></TableCell>
                     <TableCell className="text-right"><Button variant="ghost" size="sm"><Download className="h-4 w-4"/></Button></TableCell>
                  </TableRow>
                ))}
             </TableBody>
           </Table>
        </CardContent>
      </Card>

      {/* 5. DANGER ZONE */}
      <div className="border border-red-200 rounded-xl p-6 bg-red-50/30 flex justify-between items-center">
         <div><h3 className="text-red-800 font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Danger Zone</h3><p className="text-sm text-red-600 mt-1">Irreversible actions.</p></div>
         <Button variant="destructive" onClick={() => { if(confirm('Are you sure?')) { deleteClient(client.id); router.push('/admin/clients'); } }}><Trash2 className="mr-2 h-4 w-4"/> Delete Account</Button>
      </div>

      {/* --- MODALS --- */}
      
      {/* NOTIFY MODAL */}
      <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Notify {client.name}</DialogTitle><DialogDescription>Send system alerts or messages.</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
             <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                   <Label>Channels</Label>
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2"><Checkbox id="email" checked={channels.email} onCheckedChange={(v) => setChannels({...channels, email: !!v})} /><Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4"/> Email</Label></div>
                      <div className="flex items-center space-x-2"><Checkbox id="sms" checked={channels.sms} onCheckedChange={(v) => setChannels({...channels, sms: !!v})} /><Label htmlFor="sms" className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/> SMS</Label></div>
                      <div className="flex items-center space-x-2"><Checkbox id="wa" checked={channels.whatsapp} onCheckedChange={(v) => setChannels({...channels, whatsapp: !!v})} /><Label htmlFor="wa" className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-green-600"/> WhatsApp</Label></div>
                   </div>
                </div>
                <div className="w-48 bg-slate-100 rounded-xl p-3 border-4 border-slate-300 shadow-inner">
                   <p className="text-[10px] text-gray-400 text-center mb-2">Preview</p>
                   <div className="bg-white p-2 rounded-lg text-xs shadow-sm border border-slate-100"><p className="font-bold text-green-800">Saanify Admin</p><p className="text-gray-600 mt-1">{message || "Your message..."}</p></div>
                </div>
             </div>
             <Textarea placeholder="Type notification message..." className="h-24" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleSendMessage} className="bg-blue-600"><Send className="w-4 h-4 mr-2"/> Send Notification</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LEDGER MODAL */}
      <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
             <div className="flex justify-between items-center">
               <DialogTitle>Statement & Ledger</DialogTitle>
               <Button size="sm" variant="outline" className="text-orange-600 border-orange-200"><Plus className="w-4 h-4 mr-1"/> Record Manual Payment</Button>
             </div>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
             <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                   <TableRow><TableCell>12/14/2025</TableCell><TableCell>Pro Plan Subscription</TableCell><TableCell>Online</TableCell><TableCell className="font-bold">₹7,000</TableCell><TableCell><Badge className="bg-green-100 text-green-700">Paid</Badge></TableCell></TableRow>
                   <TableRow><TableCell>10/14/2025</TableCell><TableCell>Plan Upgrade</TableCell><TableCell>Failed</TableCell><TableCell className="font-bold text-red-500">₹3,000</TableCell><TableCell><Badge variant="destructive">Failed</Badge></TableCell></TableRow>
                </TableBody>
             </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* RENEW MODAL */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Change Subscription Plan</DialogTitle><DialogDescription>Select a new plan to upgrade or renew.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                {Object.entries(PLAN_DETAILS).map(([key, detail]: any) => (
                   <div key={key} onClick={() => setSelectedPlan(key)} className={`cursor-pointer border rounded-xl p-4 transition-all ${selectedPlan === key ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-slate-50'}`}>
                      <p className="font-bold text-sm">{key}</p><p className="text-xl font-bold mt-1">₹{detail.price}</p><p className="text-xs text-gray-500">{detail.limit} Members</p>
                   </div>
                ))}
             </div>
             <Separator />
             <div className="flex justify-between items-center px-2"><span className="text-sm font-medium text-gray-600">Total Payable</span><span className="text-2xl font-bold text-slate-900">₹{PLAN_DETAILS[selectedPlan].price.toLocaleString()}</span></div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsRenewOpen(false)}>Cancel</Button>
             <Button onClick={handleSimulatePayment} disabled={processingPayment} className="bg-green-600 hover:bg-green-700 min-w-[140px]">{processingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : 'Pay & Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}