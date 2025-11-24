import React, { useMemo } from 'react';
import { Dish, Friend } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trash2, Plus, Receipt, RotateCcw } from 'lucide-react';
import { DietBadge } from './DietBadge';

interface SummaryProps {
  dishes: Dish[];
  friends: Friend[];
  onToggleParticipation: (dishId: string, friendId: string) => void;
  onStartNewSplit: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'];

export const Summary: React.FC<SummaryProps> = ({ dishes, friends, onToggleParticipation, onStartNewSplit }) => {
  
  const calculation = useMemo(() => {
    const friendTotals: Record<string, number> = {};
    friends.forEach(f => friendTotals[f.id] = 0);
    
    let total = 0;

    dishes.forEach(dish => {
      total += dish.price;
      
      const payers = dish.participantIds;
      
      if (payers.length > 0) {
        const share = dish.price / payers.length;
        payers.forEach(payerId => {
          if (friendTotals[payerId] !== undefined) {
             friendTotals[payerId] += share;
          }
        });
      }
    });

    return { total, friendTotals };
  }, [dishes, friends]);

  const chartData = friends.map(f => ({
    name: f.name,
    value: calculation.friendTotals[f.id]
  })).filter(d => d.value > 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Section: Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 w-full max-w-sm">
           <div className="text-center md:text-left mb-4 md:mb-0">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
               <Receipt className="w-5 h-5 text-gray-400" />
               <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Bill</h3>
             </div>
             <p className="text-5xl font-extrabold text-indigo-600">${calculation.total.toFixed(2)}</p>
             <p className="text-sm text-gray-400 mt-2">
               {dishes.length} items split among {friends.length} people
             </p>
           </div>
        </div>

        <div className="flex-1 w-full h-[200px]">
          {calculation.total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data to display</div>
          )}
        </div>
      </div>

      {/* Grid Section: Individual Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {friends.map((friend, index) => {
          const totalOwing = calculation.friendTotals[friend.id];
          const myDishes = dishes.filter(d => d.participantIds.includes(friend.id));
          const availableDishes = dishes.filter(d => !d.participantIds.includes(friend.id));

          return (
            <div key={friend.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
              {/* Card Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{friend.name}</h4>
                    <DietBadge type={friend.diet} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-bold text-gray-800">${totalOwing.toFixed(2)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[400px]">
                {myDishes.length > 0 ? (
                  <ul className="space-y-2">
                    {myDishes.map(dish => {
                       const splitCount = dish.participantIds.length;
                       const share = dish.price / splitCount;
                       return (
                        <li key={dish.id} className="group flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors">
                          <div className="flex-1 min-w-0 pr-2">
                             <div className="flex items-center gap-2">
                               <span className="truncate font-medium text-gray-700">{dish.name}</span>
                               <span className="text-xs text-gray-400 shrink-0">
                                 (${dish.price.toFixed(0)} ÷ {splitCount})
                               </span>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-600">${share.toFixed(2)}</span>
                            <button 
                              onClick={() => onToggleParticipation(dish.id, friend.id)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
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
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-8 italic">
                    <span className="mb-1">No items yet</span>
                    <span className="text-xs opacity-70">Add items below</span>
                  </div>
                )}
              </div>

              {/* Footer: Add Item */}
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                 {availableDishes.length > 0 ? (
                   <div className="relative group">
                     <select 
                       className="w-full appearance-none bg-white border border-gray-200 text-gray-600 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
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
                     <Plus className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                   </div>
                 ) : (
                    <div className="text-center text-xs text-gray-400 py-2">All items assigned</div>
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
          className="flex items-center gap-2 px-6 py-3 bg-white border border-indigo-200 text-indigo-600 font-semibold rounded-full shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
        >
          <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
          Start a New Split
        </button>
      </div>
    </div>
  );
};