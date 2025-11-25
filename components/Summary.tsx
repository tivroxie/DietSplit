import React, { useMemo, useState, useEffect } from 'react';
import { Dish, Friend } from '../types';
import { Trash2, Plus, Receipt, RotateCcw } from 'lucide-react';
import { DietBadge } from './DietBadge';

interface SummaryProps {
  dishes: Dish[];
  friends: Friend[];
  tax: number;
  setTax: (val: number) => void;
  tip: number;
  setTip: (val: number) => void;
  onToggleParticipation: (dishId: string, friendId: string) => void;
  onStartNewSplit: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'];

export const Summary: React.FC<SummaryProps> = ({ 
  dishes, 
  friends, 
  tax, 
  setTax, 
  tip, 
  setTip, 
  onToggleParticipation, 
  onStartNewSplit 
}) => {
  const [taxMode, setTaxMode] = useState<'amount' | 'percent'>('amount');
  const [taxPercentInput, setTaxPercentInput] = useState('');

  const calculation = useMemo(() => {
    // 1. Calculate individual dish totals
    const friendSubtotals: Record<string, number> = {};
    friends.forEach(f => friendSubtotals[f.id] = 0);
    
    let subtotal = 0; // Total bill subtotal

    dishes.forEach(dish => {
      subtotal += dish.price;
      const payers = dish.participantIds;
      if (payers.length > 0) {
        const share = dish.price / payers.length;
        payers.forEach(payerId => {
          if (friendSubtotals[payerId] !== undefined) {
             friendSubtotals[payerId] += share;
          }
        });
      }
    });

    // Calculate the total cost actually assigned to people
    // This allows us to distribute tax/tip fully among those paying, even if some items are unassigned
    const assignedSubtotal = Object.values(friendSubtotals).reduce((a, b) => a + b, 0);

    // 2. Distribute Tax and Tip proportionally
    const friendFinalTotals: Record<string, number> = {};
    const friendTaxShares: Record<string, number> = {};
    const friendTipShares: Record<string, number> = {};

    friends.forEach(f => {
      const userSubtotal = friendSubtotals[f.id];
      // Use assignedSubtotal as denominator to ensure 100% of tax/tip is distributed
      // If nothing is assigned yet, prevent divide by zero
      const ratio = assignedSubtotal > 0 ? userSubtotal / assignedSubtotal : 0;
      
      const userTax = tax * ratio;
      const userTip = tip * ratio;
      
      friendTaxShares[f.id] = userTax;
      friendTipShares[f.id] = userTip;
      friendFinalTotals[f.id] = userSubtotal + userTax + userTip;
    });

    return { 
      subtotal, 
      assignedSubtotal,
      grandTotal: subtotal + tax + tip,
      friendSubtotals,
      friendTaxShares,
      friendTipShares,
      friendFinalTotals
    };
  }, [dishes, friends, tax, tip]);

  // Sync tax amount when subtotal changes if we are in percentage mode
  useEffect(() => {
    if (taxMode === 'percent' && taxPercentInput) {
      const pct = parseFloat(taxPercentInput);
      if (!isNaN(pct)) {
        const newTax = calculation.subtotal * (pct / 100);
        // Only update if difference is significant to avoid loops/rounding jitter
        if (Math.abs(newTax - tax) > 0.005) {
           setTax(parseFloat(newTax.toFixed(2)));
        }
      }
    }
  }, [calculation.subtotal, taxMode, taxPercentInput, tax, setTax]);

  const handleTaxModeChange = (mode: 'amount' | 'percent') => {
    setTaxMode(mode);
    if (mode === 'percent') {
      const pct = calculation.subtotal > 0 ? (tax / calculation.subtotal) * 100 : 0;
      setTaxPercentInput(pct > 0 ? parseFloat(pct.toFixed(2)).toString() : '');
    }
  };

  const handleTaxPercentChange = (val: string) => {
    setTaxPercentInput(val);
    const pct = parseFloat(val);
    if (!isNaN(pct)) {
        const newTax = calculation.subtotal * (pct / 100);
        setTax(parseFloat(newTax.toFixed(2)));
    } else {
        setTax(0);
    }
  };

  const setTipPercentage = (percent: number) => {
    const tipAmount = calculation.subtotal * (percent / 100);
    setTip(parseFloat(tipAmount.toFixed(2)));
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Top Section: Overview and Inputs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 flex justify-center">
        
        {/* Bill Configurator */}
        <div className="w-full max-w-md flex flex-col gap-6">
           <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
             <div className="bg-indigo-50 p-2.5 rounded-xl">
               <Receipt className="w-5 h-5 text-indigo-600" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-gray-900">Bill Breakdown</h3>
               <p className="text-xs text-gray-500 font-medium">Add tax & tip to calculate final shares</p>
             </div>
           </div>
           
           <div className="space-y-5">
             <div className="flex justify-between items-center text-gray-700 px-1">
               <span className="font-medium text-gray-600">Subtotal</span>
               <span className="font-bold text-lg text-gray-900">${calculation.subtotal.toFixed(2)}</span>
             </div>
             
             {/* Tax Input */}
             <div className="space-y-2">
               <div className="flex justify-between items-center text-sm">
                 <span className="font-medium text-gray-600">Tax</span>
                 <div className="flex bg-gray-100 p-0.5 rounded-lg">
                    <button 
                       onClick={() => handleTaxModeChange('amount')}
                       className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxMode === 'amount' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                       $
                    </button>
                    <button 
                       onClick={() => handleTaxModeChange('percent')}
                       className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxMode === 'percent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                       %
                    </button>
                 </div>
               </div>
               <div className="relative group">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none transition-colors group-focus-within:text-indigo-400">
                   {taxMode === 'amount' ? '$' : '%'}
                 </span>
                 {taxMode === 'amount' ? (
                   <input 
                     type="number" 
                     min="0"
                     step="0.01"
                     value={tax || ''}
                     onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                     placeholder="0.00"
                     className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 text-gray-800 font-semibold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                   />
                 ) : (
                    <input 
                     type="number" 
                     min="0"
                     step="0.1"
                     value={taxPercentInput}
                     onChange={(e) => handleTaxPercentChange(e.target.value)}
                     placeholder="0"
                     className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 text-gray-800 font-semibold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                   />
                 )}
                 {taxMode === 'percent' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        ${tax.toFixed(2)}
                    </span>
                 )}
               </div>
             </div>

             {/* Tip Input */}
             <div className="space-y-2">
               <span className="font-medium text-gray-600 text-sm">Tip</span>
               <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none transition-colors group-focus-within:text-indigo-400">$</span>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={tip || ''}
                      onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 text-gray-800 font-semibold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
               </div>
               <div className="flex gap-2 pt-1">
                  {[10, 15, 18, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setTipPercentage(pct)}
                      className="flex-1 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                    >
                      {pct}%
                    </button>
                  ))}
               </div>
             </div>
             
             <div className="h-px bg-gray-100 my-4"></div>

             <div className="flex justify-between items-end bg-indigo-50 p-5 rounded-xl border border-indigo-100/50">
               <span className="font-bold text-indigo-900 mb-1">Total Amount</span>
               <span className="font-black text-3xl text-indigo-600 tracking-tight">${calculation.grandTotal.toFixed(2)}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Grid Section: Individual Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {friends.map((friend, index) => {
          const finalTotal = calculation.friendFinalTotals[friend.id];
          const subTotal = calculation.friendSubtotals[friend.id];
          const taxShare = calculation.friendTaxShares[friend.id];
          const tipShare = calculation.friendTipShares[friend.id];

          const myDishes = dishes.filter(d => d.participantIds.includes(friend.id));
          const availableDishes = dishes.filter(d => !d.participantIds.includes(friend.id));

          return (
            <div key={friend.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
              {/* Card Header */}
              <div className="p-5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg leading-tight">{friend.name}</h4>
                    <DietBadge type={friend.diet} className="mt-1" />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-black text-gray-800 tracking-tight">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 p-5 overflow-y-auto max-h-[400px]">
                {myDishes.length > 0 ? (
                  <ul className="space-y-3">
                    {myDishes.map(dish => {
                       const splitCount = dish.participantIds.length;
                       const share = dish.price / splitCount;
                       return (
                        <li key={dish.id} className="group flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
                          <div className="flex-1 min-w-0 pr-2">
                             <div className="flex items-center gap-2">
                               <span className="truncate font-semibold text-gray-700">{dish.name}</span>
                               <span className="text-xs text-gray-400 shrink-0 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                 ${dish.price.toFixed(0)} ÷ {splitCount}
                               </span>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-600">${share.toFixed(2)}</span>
                            <button 
                              onClick={() => onToggleParticipation(dish.id, friend.id)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded-full"
                              title="Remove item from this person"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                       );
                    })}
                  </ul>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-12 italic border-2 border-dashed border-gray-50 rounded-xl m-2">
                    <span className="mb-1 font-medium">No items assigned</span>
                    <span className="text-xs opacity-70">Add items below</span>
                  </div>
                )}
              </div>
              
              {/* Cost Breakdown Footer */}
              <div className="bg-gray-50/80 p-4 border-t border-gray-100 text-xs space-y-1.5">
                 <div className="flex justify-between text-gray-500 font-medium">
                   <span>Items Subtotal</span>
                   <span>${subTotal.toFixed(2)}</span>
                 </div>
                 {(taxShare > 0 || tipShare > 0) && (
                   <>
                     <div className="flex justify-between text-gray-400">
                       <span>Tax Share</span>
                       <span>+${taxShare.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-400">
                       <span>Tip Share</span>
                       <span>+${tipShare.toFixed(2)}</span>
                     </div>
                   </>
                 )}
              </div>

              {/* Add Item Action */}
              <div className="p-4 border-t border-gray-100 bg-white">
                 {availableDishes.length > 0 ? (
                   <div className="relative group">
                     <select 
                       className="w-full appearance-none bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
                       onChange={(e) => {
                         if (e.target.value) {
                           onToggleParticipation(e.target.value, friend.id);
                           e.target.value = ''; // Reset select
                         }
                       }}
                       defaultValue=""
                     >
                       <option value="" disabled>+ Add item to {friend.name}</option>
                       {availableDishes.map(d => (
                         <option key={d.id} value={d.id}>{d.name} (${d.price})</option>
                       ))}
                     </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none p-1 bg-gray-100 rounded-md">
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                     </div>
                   </div>
                 ) : (
                    <div className="text-center text-xs font-semibold text-emerald-600 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      All items assigned ✓
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start New Split Action */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onStartNewSplit}
          className="flex items-center gap-3 px-8 py-4 bg-white border border-indigo-100 text-indigo-600 font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-indigo-50 hover:border-indigo-200 hover:-translate-y-0.5 transition-all group"
        >
          <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-700" />
          Start a New Split
        </button>
      </div>
    </div>
  );
};