import React, { useState, useEffect } from 'react';
import { Dish, DishType, Friend, DietType } from '../types';
import { DISH_ICONS, DISH_LABELS, DIET_LABELS } from '../constants';
import { parseReceiptText } from '../services/geminiService';
import { Plus, Trash2, Sparkles, Loader2, Info, AlertTriangle } from 'lucide-react';

interface DishListProps {
  dishes: Dish[];
  friends: Friend[];
  onAddDish: (dish: Partial<Dish> & { name: string, price: number, type: DishType }) => void;
  onRemoveDish: (id: string) => void;
  onToggleParticipation: (dishId: string, friendId: string) => void;
  onBulkAddDishes: (dishes: Omit<Dish, 'id' | 'participantIds'>[]) => void;
}

export const DishList: React.FC<DishListProps> = ({ dishes, friends, onAddDish, onRemoveDish, onToggleParticipation, onBulkAddDishes }) => {
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  
  const [smartInput, setSmartInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSmartInput, setShowSmartInput] = useState(false);

  // Initialize selected friends when friends list loads
  useEffect(() => {
    if (friends.length > 0 && selectedFriendIds.length === 0) {
      setSelectedFriendIds(friends.map(f => f.id));
    }
  }, [friends]);

  // Handle adding manually with selected friends
  const handleAdd = () => {
    if (!newDishName.trim() || !newDishPrice) return;

    // Infer dish type based on selected friends to avoid false warnings
    // Logic: If a Vegan is selected, the dish is likely Vegan.
    // If a Vegetarian is selected (and no Vegans), it's likely Vegetarian.
    // Otherwise, default to Meat (Everything).
    const participants = friends.filter(f => selectedFriendIds.includes(f.id));
    
    let inferredType = DishType.MEAT;
    const hasVegan = participants.some(p => p.diet === DietType.VEGAN);
    const hasVegetarian = participants.some(p => p.diet === DietType.VEGETARIAN);

    if (hasVegan) {
      inferredType = DishType.VEGAN;
    } else if (hasVegetarian) {
      inferredType = DishType.VEGETARIAN;
    }

    onAddDish({ 
      name: newDishName, 
      price: parseFloat(newDishPrice), 
      type: inferredType,
      participantIds: selectedFriendIds
    });

    setNewDishName('');
    setNewDishPrice('');
    // Keep friends selected for next item as they likely share the next one too
  };

  const handleSmartAdd = async () => {
    if (!smartInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await parseReceiptText(smartInput);
      if (result.length > 0) {
        onBulkAddDishes(result);
        setSmartInput('');
        setShowSmartInput(false);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to parse text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFriendSelection = (id: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const toggleAllFriends = () => {
    if (selectedFriendIds.length === friends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(friends.map(f => f.id));
    }
  };

  // Helper to check diet compatibility
  const checkCompatibility = (friend: Friend, dishType: DishType): boolean => {
    if (dishType === DishType.VEGAN) return true;
    if (dishType === DishType.VEGETARIAN) return friend.diet !== DietType.VEGAN;
    if (dishType === DishType.MEAT) return friend.diet === DietType.EVERYTHING;
    return false;
  };

  const getDietEmoji = (diet: DietType) => DIET_LABELS[diet].split(' ')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <UtensilsIcon className="w-5 h-5 text-orange-500" />
          Add Dishes
        </h2>
        <button
          onClick={() => setShowSmartInput(!showSmartInput)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${showSmartInput ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showSmartInput ? 'Close AI' : 'AI Scan'}
        </button>
      </div>

      {showSmartInput && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-medium text-purple-900 mb-2">Paste receipt or type order naturally</label>
          <textarea
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            placeholder="e.g., Shared a Pepperoni Pizza $18, Caesar Salad $12, and a Tofu Curry $15..."
            className="w-full p-3 rounded-md border-purple-200 focus:border-purple-400 focus:ring-purple-400 bg-white text-sm mb-3 min-h-[80px]"
          />
          <div className="flex justify-end">
             <button
              onClick={handleSmartAdd}
              disabled={isAnalyzing || !smartInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-70"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Auto-Add Dishes'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {dishes.map((dish) => {
          const Icon = DISH_ICONS[dish.type];
          const participantCount = dish.participantIds.length;
          const share = participantCount > 0 ? (dish.price / participantCount).toFixed(2) : '0.00';

          return (
            <div key={dish.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${dish.type === DishType.MEAT ? 'bg-red-50 text-red-500' : dish.type === DishType.VEGETARIAN ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{dish.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{DISH_LABELS[dish.type]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-800">${dish.price.toFixed(2)}</span>
                  <button onClick={() => onRemoveDish(dish.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Payers Section */}
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">
                    Splitting among {participantCount}: 
                    {participantCount > 0 && <span className="text-gray-600 ml-1">${share}/ea</span>}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 gap-y-3">
                  {friends.map(friend => {
                    const isParticipating = dish.participantIds.includes(friend.id);
                    const isCompatible = checkCompatibility(friend, dish.type);
                    
                    return (
                      <button
                        key={friend.id}
                        onClick={() => onToggleParticipation(dish.id, friend.id)}
                        className={`
                          group flex flex-col items-center justify-start gap-1 p-1 rounded-lg transition-all min-w-[50px]
                          ${isParticipating ? 'bg-indigo-50/50' : 'opacity-60 hover:opacity-100'}
                        `}
                      >
                         <div className={`
                           relative w-10 h-10 rounded-full border-2 transition-all flex-shrink-0
                           ${isParticipating ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-100 grayscale'}
                         `}>
                           <img 
                             src={friend.avatarUrl} 
                             alt={friend.name} 
                             className="w-full h-full rounded-full object-cover"
                           />
                           
                           {/* Selection Checkmark Overlay */}
                           {isParticipating && (
                             <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border border-white">
                               <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                               </svg>
                             </div>
                           )}

                           {/* Diet Warning Overlay */}
                           {!isCompatible && isParticipating && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border border-white animate-pulse" title="Incompatible Diet">
                               <AlertTriangle className="w-2.5 h-2.5 text-white" />
                              </div>
                           )}
                         </div>
                         <div className="flex flex-col items-center w-full">
                           <span className={`text-[10px] font-medium truncate max-w-[60px] leading-tight ${isParticipating ? 'text-gray-700' : 'text-gray-400'}`}>
                             {friend.name}
                           </span>
                           <span className="text-[10px] leading-tight" title={DIET_LABELS[friend.diet]}>
                             {getDietEmoji(friend.diet)}
                           </span>
                         </div>
                      </button>
                    );
                  })}
                  {participantCount === 0 && <span className="text-xs text-red-400 italic flex items-center gap-1 py-2"><Info className="w-3 h-3"/> Select someone!</span>}
                </div>
              </div>
            </div>
          );
        })}
         {dishes.length === 0 && (
          <div className="text-center py-12 text-gray-400 italic">
            No dishes yet. Add manually or use AI Scan!
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 bg-gray-50 -m-6 mt-0 p-6 rounded-b-xl border-t-2 border-dashed border-gray-200">
        <label className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase mb-3">
          <span>Add Item Manually</span>
          <button 
            onClick={toggleAllFriends}
            className="text-indigo-600 hover:text-indigo-800 text-[10px] bg-indigo-50 px-2 py-1 rounded"
          >
            {selectedFriendIds.length === friends.length ? 'Deselect All' : 'Select All'}
          </button>
        </label>
        
        <div className="flex gap-3 mb-4">
           <input
            type="text"
            placeholder="Item Name (e.g. Pizza)"
            value={newDishName}
            onChange={(e) => setNewDishName(e.target.value)}
            className="flex-grow px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all w-2/3 shadow-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="relative w-1/3">
            <span className="absolute left-3 top-2 text-gray-400">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={newDishPrice}
              onChange={(e) => setNewDishPrice(e.target.value)}
              className="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>

        {/* Friend Selector */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-wrap gap-2 gap-y-3">
            {friends.map(friend => (
              <button
                key={friend.id}
                onClick={() => toggleFriendSelection(friend.id)}
                className="flex flex-col items-center justify-start gap-1 p-1 min-w-[50px] group"
                title={`Split with ${friend.name}`}
              >
                <div className={`
                  relative w-10 h-10 rounded-full border-2 transition-all flex-shrink-0
                  ${selectedFriendIds.includes(friend.id) 
                    ? 'border-indigo-500 ring-2 ring-indigo-100 scale-100' 
                    : 'border-transparent bg-gray-200 grayscale opacity-60 hover:opacity-100 hover:scale-105'}
                `}>
                  <img 
                    src={friend.avatarUrl} 
                    alt={friend.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                  {selectedFriendIds.includes(friend.id) && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center border border-white">
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center w-full">
                  <span className={`text-[10px] font-medium truncate max-w-[50px] leading-tight ${selectedFriendIds.includes(friend.id) ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {friend.name}
                  </span>
                  <span className="text-[10px] leading-tight opacity-80" title={DIET_LABELS[friend.diet]}>
                    {getDietEmoji(friend.diet)}
                  </span>
                </div>
              </button>
            ))}
            {friends.length === 0 && <span className="text-sm text-gray-400 italic">No friends added</span>}
          </div>

          <button
            onClick={handleAdd}
            disabled={!newDishName.trim() || !newDishPrice}
            className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex-shrink-0 self-center"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Icon wrapper to avoid redefining everywhere
const UtensilsIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
)