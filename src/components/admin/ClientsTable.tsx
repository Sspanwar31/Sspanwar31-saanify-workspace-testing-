'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import { useRouter } from 'next/navigation';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, Trash2, Lock, Unlock, Eye, Calendar, Edit
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function ClientsTable({ onEdit }: { onEdit?: (client: any) => void }) {
  const router = useRouter();
  const { clients, deleteClient, updateClientStatus } = useAdminStore();
  
  // Handlers
  const handleStatusChange = (id: number, status: any) => {
     updateClientStatus(id, status);
     toast.success(`Client marked as ${status}`);
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-bold text-slate-700">Client Name</TableHead>
            <TableHead className="font-bold text-slate-700">Plan</TableHead>
            <TableHead className="font-bold text-slate-700">Status</TableHead>
            <TableHead className="font-bold text-slate-700">Members</TableHead>
            <TableHead className="font-bold text-slate-700">Revenue</TableHead>
            <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length > 0 ? (
            clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-slate-50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">{client.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="font-mono border-slate-300">{client.plan}</Badge></TableCell>
                <TableCell>
                   <Badge className={
                      client.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                      client.status === 'LOCKED' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 
                      'bg-yellow-100 text-yellow-800'
                   }>{client.status}</Badge>
                </TableCell>
                <TableCell className="text-slate-600">{client.members}</TableCell>
                <TableCell className="font-bold text-slate-700">₹{client.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-slate-200 rounded-full h-8 w-8">
                        <MoreHorizontal className="h-4 w-4 text-slate-500"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Manage Client</DropdownMenuLabel>
                      
                      <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}`)} className="cursor-pointer">
                         <Eye className="mr-2 h-4 w-4 text-blue-600"/> View Profile
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => onEdit && onEdit(client)} className="cursor-pointer">
                         <Edit className="mr-2 h-4 w-4 text-slate-600"/> Edit Details
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {client.status === 'LOCKED' ? (
                         <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'ACTIVE')} className="cursor-pointer">
                           <Unlock className="mr-2 h-4 w-4 text-green-600"/> Unlock Account
                         </DropdownMenuItem>
                      ) : (
                         <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'LOCKED')} className="cursor-pointer">
                           <Lock className="mr-2 h-4 w-4 text-orange-600"/> Lock Account
                         </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'EXPIRED')} className="cursor-pointer">
                           <Calendar className="mr-2 h-4 w-4 text-slate-500"/> Mark Expired
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="text-red-600 cursor-pointer focus:bg-red-50" onClick={() => { if(confirm('Delete?')) deleteClient(client.id) }}>
                         <Trash2 className="mr-2 h-4 w-4"/> Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No clients found. Add one!</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}