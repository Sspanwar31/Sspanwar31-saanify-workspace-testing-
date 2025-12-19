'use client';

import { useState } from 'react';
import { useAdminStore, SubAdmin } from '@/lib/admin/store';
import { 
  Shield, Save, UploadCloud, RotateCcw, Plus, Trash2, Edit,
  Settings, Database, Github, CheckCircle, Loader2, PauseCircle, PlayCircle,
  Globe, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function SettingsPage() {
  const { admins, addAdmin, updateAdmin, deleteAdmin, githubConfig, updateGithubConfig } = useAdminStore();
  
  // Modal States
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // Admin Form State
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', role: 'SUPPORT', status: 'ACTIVE' });

  // Config State (Mock for UI)
  const [config, setConfig] = useState({
    trialDays: 15, maxBasic: 25, maxPro: 100, maintenance: false, autoRenew: true, emailNotify: true
  });

  // Handle Backup (Real API Call)
  const handleBackup = async () => {
    if (!githubConfig.token || !githubConfig.repo) {
      toast.error("Please configure GitHub settings first!");
      setIsConfigOpen(true);
      return;
    }
    setIsBackupRunning(true);
    try {
      const res = await fetch('/api/admin/github-backup', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(githubConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      updateGithubConfig({ lastBackup: new Date().toISOString() });
      toast.success("✅ Backup pushed to GitHub (src updated)");
    } catch (e: any) {
      toast.error("Backup Failed: " + e.message);
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleSaveAdmin = () => {
    if (!adminForm.name || !adminForm.email) return toast.error("Name/Email required");
    
    if (editingAdmin) {
      updateAdmin(editingAdmin.id, adminForm as any);
      toast.success("Admin Updated");
    } else {
      addAdmin(adminForm as any);
      toast.success("New Admin Added");
    }
    setIsAdminModalOpen(false);
  };

  const openEditAdmin = (admin: SubAdmin) => {
    setEditingAdmin(admin);
    setAdminForm({ name: admin.name, email: admin.email, role: admin.role, status: admin.status });
    setIsAdminModalOpen(true);
  };

  const openAddAdmin = () => {
    setEditingAdmin(null);
    setAdminForm({ name: '', email: '', role: 'SUPPORT', status: 'ACTIVE' });
    setIsAdminModalOpen(true);
  };

  const isConnected = !!githubConfig.token && !!githubConfig.repo;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
           <p className="text-gray-500">Configure core preferences & security</p>
        </div>
        <Button onClick={() => toast.success("Settings Saved")} className="bg-slate-900 text-white">
           <Save className="w-4 h-4 mr-2"/> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. ADMIN MANAGEMENT */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-800"><Shield className="h-5 w-5 text-blue-600"/> Admin Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
             {admins.map(admin => (
               <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                        {admin.name.charAt(0)}
                     </div>
                     <div>
                        <p className="font-bold text-sm text-slate-900">{admin.name}</p>
                        <p className="text-xs text-slate-500">{admin.email} • {admin.role}</p>
                     </div>
                  </div>
                  <div className="flex gap-2 items-center">
                     <Badge className={admin.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {admin.status}
                     </Badge>
                     
                     <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditAdmin(admin)}>
                        <Edit className="h-4 w-4"/>
                     </Button>
                     
                     {admin.role !== 'ADMIN' && (
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteAdmin(admin.id)}>
                          <Trash2 className="h-4 w-4"/>
                       </Button>
                     )}
                  </div>
               </div>
             ))}
             <Button variant="outline" className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 mt-2" onClick={openAddAdmin}>
                <Plus className="mr-2 h-4 w-4"/> Add New Admin
             </Button>
          </CardContent>
        </Card>

        {/* 2. BACKUP CENTER (Smart Widget) */}
        <Card className="border-slate-200 shadow-sm bg-white relative overflow-hidden">
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
          
          <CardHeader className="border-b bg-slate-50/50">
             <div className="flex justify-between items-center">
               <CardTitle className="flex items-center gap-2 text-slate-800"><Database className="h-5 w-5 text-purple-600"/> Backup Center</CardTitle>
               <Button size="sm" variant="ghost" onClick={() => setIsConfigOpen(true)}>
                  <Settings className="h-4 w-4 text-slate-500 hover:text-slate-900" />
               </Button>
             </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 relative z-10">
             <div className="flex items-center gap-4">
                <div className="relative cursor-pointer" onClick={() => setIsConfigOpen(true)}>
                   <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                      <Github className="h-8 w-8 text-white" />
                   </div>
                   <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                <div>
                   <h3 className="text-xl font-bold text-slate-900">{isConnected ? 'System Secured' : 'Not Configured'}</h3>
                   <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-green-600"/> 
                      Last Backup: {githubConfig.lastBackup ? new Date(githubConfig.lastBackup).toLocaleTimeString() : 'Never'}
                   </p>
                   <p className="text-xs text-purple-600 mt-1 font-medium">{githubConfig.repo || 'Repository not linked'}</p>
                </div>
             </div>
             
             <div className="flex gap-3">
                <Button onClick={handleBackup} disabled={isBackupRunning} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                   {isBackupRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Pushing...</> : <><UploadCloud className="mr-2 h-4 w-4"/> Backup Now</>}
                </Button>
                <Button variant="outline" className="flex-1">
                   <RotateCcw className="mr-2 h-4 w-4"/> Restore
                </Button>
             </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. GLOBAL CONFIGURATION (Restored) */}
      <Card className="border-t-4 border-t-orange-500 shadow-md">
         <CardHeader><CardTitle className="flex items-center gap-2 text-slate-800"><Globe className="h-5 w-5 text-orange-500"/> Global Configuration</CardTitle></CardHeader>
         <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <Label>Trial Duration (Days)</Label>
                  <Input type="number" value={config.trialDays} onChange={(e) => setConfig({...config, trialDays: parseInt(e.target.value)})} />
               </div>
               <div className="space-y-2">
                  <Label>Max Users (Basic)</Label>
                  <Input type="number" value={config.maxBasic} onChange={(e) => setConfig({...config, maxBasic: parseInt(e.target.value)})} />
               </div>
               <div className="space-y-2">
                  <Label>Max Users (Pro)</Label>
                  <Input type="number" value={config.maxPro} onChange={(e) => setConfig({...config, maxPro: parseInt(e.target.value)})} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                  <div><p className="font-bold text-sm">Auto-Renewal</p><p className="text-xs text-gray-500">Auto-extend paid plans</p></div>
                  <Switch checked={config.autoRenew} onCheckedChange={(v) => setConfig({...config, autoRenew: v})}/>
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                  <div><p className="font-bold text-sm">Email Notify</p><p className="text-xs text-gray-500">Alerts on expiry</p></div>
                  <Switch checked={config.emailNotify} onCheckedChange={(v) => setConfig({...config, emailNotify: v})}/>
               </div>
               <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div><p className="font-bold text-sm text-red-700">Maintenance Mode</p><p className="text-xs text-red-500">Stop all access</p></div>
                  <Switch checked={config.maintenance} onCheckedChange={(v) => setConfig({...config, maintenance: v})}/>
               </div>
            </div>
         </CardContent>
      </Card>

      {/* --- GITHUB CONFIG MODAL --- */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
               <div className="flex items-center gap-3">
                  <Github className="h-8 w-8 text-slate-900"/>
                  <div><DialogTitle>GitHub Configuration</DialogTitle><DialogDescription>Manage repository sync settings</DialogDescription></div>
               </div>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <div className="space-y-2"><Label>GitHub Username</Label><Input value={githubConfig.username} onChange={(e) => updateGithubConfig({username: e.target.value})} placeholder="e.g. Sspanwar31"/></div>
               <div className="space-y-2"><Label>Repository Name</Label><Input value={githubConfig.repo} onChange={(e) => updateGithubConfig({repo: e.target.value})} placeholder="e.g. saanify-backup"/></div>
               <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={githubConfig.token} onChange={(e) => updateGithubConfig({token: e.target.value})} placeholder="ghp_***"/></div>
               <div className="space-y-2"><Label>Branch</Label><Input value={githubConfig.branch} onChange={(e) => updateGithubConfig({branch: e.target.value})} placeholder="main"/></div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
               <Button onClick={() => {toast.success("Settings Saved"); setIsConfigOpen(false);}} className="bg-slate-900">Save Config</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- ADMIN MODAL --- */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
         <DialogContent>
            <DialogHeader><DialogTitle>{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2"><Label>Full Name</Label><Input value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} /></div>
               <div className="space-y-2"><Label>Email</Label><Input value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label>Role</Label>
                    <Select value={adminForm.role} onValueChange={v => setAdminForm({...adminForm, role: v})}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="SUPPORT">Support</SelectItem>
                          <SelectItem value="SALES">Sales</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2"><Label>Status</Label>
                    <Select value={adminForm.status} onValueChange={v => setAdminForm({...adminForm, status: v})}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
               </div>
            </div>
            <DialogFooter><Button onClick={handleSaveAdmin}>Save Admin</Button></DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}