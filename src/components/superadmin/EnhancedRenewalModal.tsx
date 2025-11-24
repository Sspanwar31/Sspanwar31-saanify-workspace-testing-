"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle } from 'lucide-react'

// Enhanced Renewal Modal Component
function EnhancedRenewalModal({ 
  showRenewModal, 
  setShowRenewModal, 
  selectedClientForRenew, 
  selectedPlan, 
  setSelectedPlan, 
  subscriptionPlans, 
  confirmRenewal,
  autoRenewEnabled,
  setAutoRenewEnabled
}: any) {
  return (
    <Dialog open={showRenewModal} onOpenChange={setShowRenewModal}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-400" />
            Renew Subscription - {selectedClientForRenew?.name}
          </DialogTitle>
          <DialogDescription>
            Choose a new subscription plan for this client
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Select New Plan</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPlan === plan.name
                      ? 'bg-cyan-500/20 border-cyan-400'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{plan.name}</h3>
                      <p className="text-white/60 text-sm">₹{plan.priceInr.toLocaleString('en-IN')}/{plan.duration}</p>
                      {plan.price > 0 && (
                        <p className="text-white/40 text-xs">(${plan.price}/{plan.duration})</p>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPlan === plan.name
                        ? 'bg-cyan-400 border-cyan-400'
                        : 'border-white/30'
                    }`}></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-white/70 text-xs">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Renew Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Enable Auto-Renewal</h4>
              <p className="text-white/60 text-sm">Automatically renew subscription when it expires</p>
            </div>
            <button
              onClick={() => setAutoRenewEnabled(!autoRenewEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRenewEnabled ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRenewEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRenewModal(false)
                setSelectedPlan('')
                setAutoRenewEnabled(false)
              }}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRenewal}
              disabled={!selectedPlan}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50"
            >
              Save & Renew
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}