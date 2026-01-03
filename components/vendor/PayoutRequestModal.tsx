// components/vendor/PayoutRequestModal.tsx
// Vendor Payout Request Modal

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Wallet,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  Building2,
} from 'lucide-react'

interface PayoutRequestModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
  minimumPayout?: number
  bankName: string | null
  bankAccount: string | null
  bkashNumber: string | null
  onSuccess?: () => void
}

type PayoutMethod = 'BANK_TRANSFER' | 'BKASH'

export default function PayoutRequestModal({
  isOpen,
  onClose,
  balance,
  minimumPayout = 1000,
  bankName,
  bankAccount,
  bkashNumber,
  onSuccess,
}: PayoutRequestModalProps) {
  const [method, setMethod] = useState<PayoutMethod | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasBankDetails = bankName && bankAccount
  const hasBkash = !!bkashNumber
  const canRequestPayout = balance >= minimumPayout && (hasBankDetails || hasBkash)

  const handleSubmit = async () => {
    if (!method) {
      setError('Please select a payout method')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < minimumPayout) {
      setError(`Minimum payout amount is ৳${minimumPayout.toLocaleString()}`)
      return
    }

    if (amountNum > balance) {
      setError('Amount exceeds available balance')
      return
    }

    if (method === 'BANK_TRANSFER' && !hasBankDetails) {
      setError('Please add bank details in settings first')
      return
    }

    if (method === 'BKASH' && !hasBkash) {
      setError('Please add bKash number in settings first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/vendor/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          amount: amountNum,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request payout')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        onSuccess?.()
        // Reset state
        setMethod(null)
        setAmount('')
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setMethod(null)
      setAmount('')
      setError(null)
      setSuccess(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
  }

  const maskAccount = (account: string) => {
    if (account.length <= 4) return account
    return `****${account.slice(-4)}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#0f1d32] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Request Payout</h2>
                    <p className="text-sm text-white/50">
                      Available: {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Payout Requested!
                    </h3>
                    <p className="text-white/60">
                      Your payout request has been submitted. It will be processed within 1-3 business days.
                    </p>
                  </motion.div>
                ) : !canRequestPayout ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Cannot Request Payout
                    </h3>
                    {balance < minimumPayout ? (
                      <p className="text-white/60">
                        Minimum balance of {formatCurrency(minimumPayout)} required.
                        Your current balance is {formatCurrency(balance)}.
                      </p>
                    ) : (
                      <p className="text-white/60">
                        Please add bank details or bKash number in settings to receive payouts.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payout Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-3">
                        Select Payout Method
                      </label>
                      <div className="space-y-3">
                        {/* Bank Transfer Option */}
                        <button
                          onClick={() => hasBankDetails && setMethod('BANK_TRANSFER')}
                          disabled={!hasBankDetails}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            method === 'BANK_TRANSFER'
                              ? 'bg-sky-500/10 border-sky-500/50'
                              : hasBankDetails
                              ? 'bg-white/5 border-white/10 hover:bg-white/10'
                              : 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              method === 'BANK_TRANSFER'
                                ? 'bg-sky-500/20'
                                : 'bg-white/10'
                            }`}>
                              <CreditCard className={`w-5 h-5 ${
                                method === 'BANK_TRANSFER' ? 'text-sky-400' : 'text-white/50'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${
                                method === 'BANK_TRANSFER' ? 'text-white' : 'text-white/80'
                              }`}>
                                Bank Transfer
                              </p>
                              {hasBankDetails ? (
                                <p className="text-sm text-white/50">
                                  {bankName} • {maskAccount(bankAccount!)}
                                </p>
                              ) : (
                                <p className="text-sm text-amber-400">
                                  Add bank details in settings
                                </p>
                              )}
                            </div>
                            {method === 'BANK_TRANSFER' && (
                              <CheckCircle2 className="w-5 h-5 text-sky-400" />
                            )}
                          </div>
                        </button>

                        {/* bKash Option */}
                        <button
                          onClick={() => hasBkash && setMethod('BKASH')}
                          disabled={!hasBkash}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            method === 'BKASH'
                              ? 'bg-[#E2136E]/10 border-[#E2136E]/50'
                              : hasBkash
                              ? 'bg-white/5 border-white/10 hover:bg-white/10'
                              : 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              method === 'BKASH'
                                ? 'bg-[#E2136E]/20'
                                : 'bg-white/10'
                            }`}>
                              <div className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                                method === 'BKASH' ? 'bg-[#E2136E] text-white' : 'bg-white/20 text-white/50'
                              }`}>
                                b
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${
                                method === 'BKASH' ? 'text-white' : 'text-white/80'
                              }`}>
                                bKash
                              </p>
                              {hasBkash ? (
                                <p className="text-sm text-white/50">
                                  {bkashNumber}
                                </p>
                              ) : (
                                <p className="text-sm text-amber-400">
                                  Add bKash number in settings
                                </p>
                              )}
                            </div>
                            {method === 'BKASH' && (
                              <CheckCircle2 className="w-5 h-5 text-[#E2136E]" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">৳</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value)
                            setError(null)
                          }}
                          placeholder={minimumPayout.toString()}
                          min={minimumPayout}
                          max={balance}
                          step="1"
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/40">
                          Min: {formatCurrency(minimumPayout)}
                        </span>
                        <button
                          onClick={() => setAmount(Math.floor(balance).toString())}
                          className="text-xs text-sky-400 hover:text-sky-300"
                        >
                          Use full balance
                        </button>
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    {balance >= minimumPayout && (
                      <div className="flex gap-2">
                        {[1000, 2000, 5000, 10000]
                          .filter(amt => amt <= balance)
                          .map(amt => (
                            <button
                              key={amt}
                              onClick={() => setAmount(amt.toString())}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                amount === amt.toString()
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                              }`}
                            >
                              ৳{amt.toLocaleString()}
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Processing Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-white/50">
                          Payouts are typically processed within 1-3 business days.
                          Bank transfers may take additional time depending on your bank.
                        </p>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-sm text-red-400">{error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!success && canRequestPayout && (
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4 py-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !method || !amount}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Request Payout
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
