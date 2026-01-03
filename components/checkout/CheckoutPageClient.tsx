'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, CreditCard, Truck, Plus, Check,
  Droplets, Info, ChevronRight
} from 'lucide-react';

interface CheckoutClientProps {
  data: {
    cart: any;
    addresses: any[];
    zones: any[];
  };
}

export function CheckoutClient({ data }: CheckoutClientProps) {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState(
    data.addresses.find((a) => a.isDefault)?.id || data.addresses[0]?.id || ''
  );
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // Calculate cart totals
  let subtotal = 0;
  let depositTotal = 0;

  data.cart.items.forEach((item: any) => {
    const price = Number(item.product.priceBDT);
    const deposit = item.product.depositBDT ? Number(item.product.depositBDT) : 0;
    subtotal += price * item.quantity;
    const newJars = Math.max(0, item.quantity - item.exchangeJars);
    depositTotal += newJars * deposit;
  });

  const address = data.addresses.find((a) => a.id === selectedAddress);
  const zone = address?.zone || data.zones[0];
  const deliveryFee = subtotal >= 500 ? 0 : (zone?.deliveryFee || 30);
  const total = subtotal + depositTotal + deliveryFee;

  // Get available slots for selected zone
  const availableSlots = zone?.slots || [];
  const today = new Date().getDay();

  const handleSubmit = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddress,
          deliverySlot: selectedSlot || undefined,
          paymentMethod,
          customerNote: note || undefined,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        if (paymentMethod === 'COD') {
          router.push(`/orders/${result.order.id}?success=true`);
        } else {
          // Redirect to payment gateway
          window.location.href = result.paymentUrl;
        }
      } else {
        alert(result.error || 'Failed to place order');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-bold">Delivery Address</h2>
              </div>

              {data.addresses.length > 0 ? (
                <div className="space-y-3">
                  {data.addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedAddress === addr.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        {selectedAddress === addr.id && (
                          <Check className="w-5 h-5 text-cyan-600" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{addr.fullName}</p>
                      <p className="text-sm text-slate-500">{addr.address}</p>
                      <p className="text-sm text-slate-500">{addr.area}, {addr.district}</p>
                      <p className="text-sm text-slate-500">{addr.phone}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <Link
                  href="/dashboard/addresses?redirect=/checkout"
                  className="block p-6 border-2 border-dashed rounded-xl text-center hover:border-cyan-500"
                >
                  <Plus className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-medium">Add Delivery Address</p>
                </Link>
              )}
            </div>

            {/* Delivery Time */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-bold">Delivery Time</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedSlot('')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    selectedSlot === ''
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-cyan-300'
                  }`}
                >
                  <p className="font-medium">ASAP</p>
                  <p className="text-xs text-slate-500">Within 2-4 hours</p>
                </button>
                {availableSlots
                  .filter((slot: any) => slot.dayOfWeek >= today)
                  .slice(0, 5)
                  .map((slot: any) => {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const slotId = `${slot.dayOfWeek}-${slot.startTime}`;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slotId)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          selectedSlot === slotId
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-slate-200 hover:border-cyan-300'
                        }`}
                      >
                        <p className="font-medium">{days[slot.dayOfWeek]}</p>
                        <p className="text-xs text-slate-500">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-bold">Payment Method</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
                  { id: 'BKASH', label: 'bKash', icon: '📱' },
                  { id: 'NAGAD', label: 'Nagad', icon: '📱' },
                  { id: 'CARD', label: 'Card', icon: '💳' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      paymentMethod === method.id
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 hover:border-cyan-300'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{method.icon}</span>
                    <p className="font-medium text-sm">{method.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Note */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
              <h2 className="font-bold mb-4">Order Note (Optional)</h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special instructions for delivery..."
                className="w-full p-4 rounded-xl border border-slate-200 resize-none h-24"
              />
            </div>
          </div>

          {/* Right - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {data.cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Droplets className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">
                      ৳{Number(item.product.priceBDT) * item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>৳{subtotal}</span>
                </div>
                {depositTotal > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span className="flex items-center gap-1">
                      Jar Deposit
                      <Info className="w-3 h-3" />
                    </span>
                    <span>৳{depositTotal}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `৳${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>৳{total}</span>
                </div>
              </div>

              {depositTotal > 0 && (
                <p className="text-xs text-slate-500 mt-4 flex items-start gap-1">
                  <Info className="w-4 h-4 shrink-0" />
                  Deposit is refundable when you return empty jars
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={processing || !selectedAddress}
                className="w-full mt-6 py-4 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? 'Processing...' : (
                  <>
                    Place Order - ৳{total}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By placing order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
