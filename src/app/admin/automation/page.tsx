'use client';
import { useAdminStore } from '@/lib/admin/store';
import { 
  Play, RotateCcw, AlertCircle, CheckCircle, Clock, Mail, 
  Bell, Server, Activity, PauseCircle, PlayCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AutomationPage() {
  const { systemTasks, commRules, runTask, toggleCommRule } = useAdminStore();

  const handleRun = (id: string) => {
    runTask(id);
    toast.info("Task Triggered: Execution started");
    setTimeout(() => {
       // Simulate completion
       toast.success("Task Completed Successfully");
       // In real app, store would update status
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Automation Center</h1>
        <p className="text-gray-500">Manage cron jobs, backups, and communication workflows</p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="system">System Tasks</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        {/* TAB 1: SYSTEM TASKS */}
        <TabsContent value="system" className="space-y-4">
           <div className="grid gap-4">
              {systemTasks.map(task => (
                <Card key={task.id} className="border-l-4 border-l-blue-500 shadow-sm">
                   <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Server className="h-6 w-6 text-blue-600"/>
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-slate-800">{task.name}</h3>
                            <p className="text-sm text-gray-500">{task.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                               <Badge variant="outline" className="font-mono text-xs"><Clock className="w-3 h-3 mr-1"/> {task.schedule}</Badge>
                               <span className="text-xs text-gray-400">Last Run: {task.lastRunTime}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                         <Badge className={
                            task.lastRunStatus === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                            task.lastRunStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                         }>
                            {task.lastRunStatus}
                         </Badge>
                         <Button size="sm" variant="outline" onClick={() => handleRun(task.id)}>
                            <Play className="w-3 h-3 mr-2"/> Run Now
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        {/* TAB 2: COMMUNICATIONS */}
        <TabsContent value="communication" className="space-y-8">
           
           {/* Email Automation */}
           <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Mail className="w-5 h-5"/> Email Workflows</h3>
              <div className="grid md:grid-cols-2 gap-4">
                 {commRules.filter(r => r.type === 'EMAIL').map(rule => (
                    <Card key={rule.id}>
                       <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="font-bold text-slate-800">{rule.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                   Sent: <span className="font-bold text-green-600">{rule.stats.sent}</span> | 
                                   Pending: <span className="font-bold text-orange-600">{rule.stats.pending}</span>
                                </p>
                             </div>
                             <Switch checked={rule.status === 'ACTIVE'} onCheckedChange={() => toggleCommRule(rule.id)} />
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="secondary" className={rule.status === 'ACTIVE' ? "text-green-600 bg-green-50" : "text-gray-500"}>
                                {rule.status}
                             </Badge>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           </div>

           {/* Push Notifications */}
           <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Bell className="w-5 h-5"/> Push Notifications</h3>
              <div className="grid md:grid-cols-2 gap-4">
                 {commRules.filter(r => r.type === 'PUSH').map(rule => (
                    <Card key={rule.id}>
                       <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="font-bold text-slate-800">{rule.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Last Sent: {rule.stats.lastSent}</p>
                             </div>
                             <Switch checked={rule.status === 'ACTIVE'} onCheckedChange={() => toggleCommRule(rule.id)} />
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="secondary" className={rule.status === 'ACTIVE' ? "text-blue-600 bg-blue-50" : "text-gray-500"}>
                                {rule.status}
                             </Badge>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}