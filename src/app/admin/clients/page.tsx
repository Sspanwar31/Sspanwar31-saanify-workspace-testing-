'use client';
import { useState } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import { ClientsTable } from '@/components/admin/ClientsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function ClientsPage() {
  const { addClient } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Updated State with new fields
  const [formData, setFormData] = useState({ 
    name: '', 
    adminName: '', 
    email: '', 
    phone: '', 
    plan: 'TRIAL', 
    address: '',
    status: 'ACTIVE' 
  });

  const handleAdd = () => {
    if (!formData.name || !formData.email || !formData.adminName) {
      return toast.error("Please fill required fields (*)");
    }
    
    addClient({
      ...formData,
      revenue: 0,
      members: 0,
      loans: 0,
      passbooks: 0,
      joinDate: new Date().toISOString(),
      subscriptionEndsAt: new Date(Date.now() + 15*24*60*60*1000).toISOString(),
      created: new Date().toISOString()
    } as any);

    toast.success("New Client Added Successfully");
    setIsOpen(false);
    setFormData({ name: '', adminName: '', email: '', phone: '', plan: 'TRIAL', address: '', status: 'ACTIVE' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Client Management</h1>
           <p className="text-gray-500">Manage Society Subscriptions & Access</p>
        </div>

        {/* ADD CLIENT MODAL */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4"/> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Enter client details to create a new society account</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
               {/* Society Name */}
               <div className="space-y-2">
                 <Label>Society Name *</Label>
                 <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter society name"/>
               </div>

               {/* Admin Name */}
               <div className="space-y-2">
                 <Label>Admin Name *</Label>
                 <Input value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} placeholder="Enter admin name"/>
               </div>

               {/* Email & Phone */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Admin Email *</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@society.com"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210"/>
                  </div>
               </div>

               {/* Plan */}
               <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <Select onValueChange={v => setFormData({...formData, plan: v})} defaultValue="TRIAL">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRIAL">Trial (15 Days)</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
               </div>

               {/* Address */}
               <div className="space-y-2">
                 <Label>Address</Label>
                 <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Enter society address..." className="h-20"/>
               </div>
            </div>

            <DialogFooter>
               <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
               <Button onClick={handleAdd} className="bg-blue-600">+ Add Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ClientsTable />
    </div>
  );
}