import React, { useState, useEffect } from 'react';
import { FriendList } from './components/FriendList';
import { DishList } from './components/DishList';
import { Summary } from './components/Summary';
import { Friend, Dish, DietType, DishType, SavedSplit } from './types';
import { INITIAL_FRIENDS } from './constants';
import { ArrowRight, ArrowLeft } from 'lucide-react';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to check diet compatibility
const isDietCompatible = (friend: Friend, dishType: DishType): boolean => {
  if (dishType === DishType.VEGAN) return true;
  if (dishType === DishType.VEGETARIAN) return friend.diet !== DietType.VEGAN;
  if (dishType === DishType.MEAT) return friend.diet === DietType.EVERYTHING;
  return false;
};

const App: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [history, setHistory] = useState<SavedSplit[]>([]);
  
  // New State for Tax and Tips
  const [tax, setTax] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dietSplitHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const addFriend = (data: Omit<Friend, 'id' | 'avatarUrl'>) => {
    const newFriend: Friend = {
      ...data,
      id: generateId(),
      avatarUrl: `https://picsum.photos/40/40?random=${Date.now()}`
    };
    setFriends([...friends, newFriend]);
  };

  const removeFriend = (id: string) => {
    setFriends(friends.filter(f => f.id !== id));
    // Remove friend from all dish participation lists
    setDishes(dishes.map(d => ({
      ...d,
      participantIds: d.participantIds.filter(pid => pid !== id)
    })));
  };

  const addDish = (data: Partial<Dish> & { name: string, price: number, type: DishType }) => {
    // If participants are explicitly provided (Manual Add), use them.
    // Otherwise (Smart Add), calculate based on diet compatibility.
    let participants = data.participantIds;

    if (!participants) {
      participants = friends
        .filter(f => isDietCompatible(f, data.type))
        .map(f => f.id);
    }

    const newDish: Dish = {
      id: generateId(),
      name: data.name,
      price: data.price,
      type: data.type,
      participantIds: participants
    };
    setDishes([...dishes, newDish]);
  };

  const bulkAddDishes = (items: Omit<Dish, 'id' | 'participantIds'>[]) => {
    const newDishes = items.map(item => {
      const initialParticipants = friends
        .filter(f => isDietCompatible(f, item.type))
        .map(f => f.id);
      
      return {
        ...item,
        id: generateId(),
        participantIds: initialParticipants
      };
    });
    setDishes([...dishes, ...newDishes]);
  };

  const removeDish = (id: string) => {
    setDishes(dishes.filter(d => d.id !== id));
  };

  const updateDishType = (dishId: string, newType: DishType) => {
    setDishes(dishes.map(d => {
      if (d.id !== dishId) return d;
      
      // When type changes, strictly reset participants based on new compatibility rules.
      // This is the "Smart" part of Smart Splitting.
      const newParticipants = friends
        .filter(f => isDietCompatible(f, newType))
        .map(f => f.id);

      return {
        ...d,
        type: newType,
        participantIds: newParticipants
      };
    }));
  };

  const toggleParticipation = (dishId: string, friendId: string) => {
    setDishes(dishes.map(dish => {
      if (dish.id !== dishId) return dish;
      const isParticipating = dish.participantIds.includes(friendId);
      return {
        ...dish,
        participantIds: isParticipating
          ? dish.participantIds.filter(id => id !== friendId) // Remove
          : [...dish.participantIds, friendId] // Add
      };
    }));
  };

  const startNewSplit = () => {
    // Only save if there was actual data
    if (dishes.length > 0 && friends.length > 0) {
      const subtotal = dishes.reduce((acc, d) => acc + d.price, 0);
      const newRecord: SavedSplit = {
        id: generateId(),
        date: new Date().toISOString(),
        subtotal: subtotal,
        tax: tax,
        tip: tip,
        total: subtotal + tax + tip,
        friendCount: friends.length,
        dishCount: dishes.length,
        friends: [...friends],
        dishes: [...dishes]
      };
      
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('dietSplitHistory', JSON.stringify(updatedHistory));
    }

    // Reset App State
    setFriends(INITIAL_FRIENDS);
    setDishes([]);
    setTax(0);
    setTip(0);
    setStep(1);
  };

  const loadHistorySplit = (split: SavedSplit) => {
    setFriends(split.friends);
    setDishes(split.dishes);
    setTax(split.tax || 0);
    setTip(split.tip || 0);
    setStep(3); // Go straight to summary view
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">DietSplit</h1>
            <p className="text-xs text-gray-500 font-medium">Smart Splitting for Mixed Diets</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {step > 1 && (
             <button 
               onClick={handleBack}
               className="text-sm font-medium text-gray-500 hover:text-indigo-600 px-3 py-1 flex items-center gap-1 transition-colors"
             >
               <ArrowLeft className="w-4 h-4" />
               Back
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 w-full mx-auto">
        {step === 1 && (
           <div className="max-w-2xl mx-auto w-full h-[calc(100vh-140px)] min-h-[500px] flex flex-col gap-6 animate-in slide-in-from-left-4 fade-in duration-300">
             <div className="text-center mb-2">
               <h2 className="text-2xl font-bold text-gray-800">Who's eating?</h2>
               <p className="text-gray-500">Add everyone to the group to get started.</p>
             </div>
             
             <div className="flex-1 h-full min-h-0">
               <FriendList 
                  friends={friends} 
                  history={history}
                  onAddFriend={addFriend} 
                  onRemoveFriend={removeFriend} 
                  onLoadHistorySplit={loadHistorySplit}
                />
             </div>

             <button 
               onClick={() => setStep(2)}
               disabled={friends.length === 0}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
             >
               Start Adding Dishes
               <ArrowRight className="w-5 h-5" />
             </button>
           </div>
        )}

        {step === 2 && (
          <div className="max-w-3xl mx-auto w-full h-[calc(100vh-140px)] min-h-[600px] flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-2">
               <h2 className="text-2xl font-bold text-gray-800">What did you order?</h2>
               <p className="text-gray-500">Add dishes and assign them to people.</p>
             </div>

             <div className="flex-1 h-full min-h-0">
              <DishList 
                dishes={dishes} 
                friends={friends} 
                onAddDish={addDish} 
                onRemoveDish={removeDish}
                onToggleParticipation={toggleParticipation}
                onBulkAddDishes={bulkAddDishes}
                onUpdateDishType={updateDishType}
              />
            </div>

             <button 
               onClick={() => setStep(3)}
               disabled={dishes.length === 0}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
             >
               View Receipt Summary
               <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        )}

        {step === 3 && (
           <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-12">
             <div className="text-center mb-2">
               <h2 className="text-2xl font-bold text-gray-800">The Split</h2>
               <p className="text-gray-500">Review and adjust the final breakdown.</p>
             </div>
             
             <div className="flex-1">
               <Summary 
                  dishes={dishes} 
                  friends={friends} 
                  tax={tax}
                  setTax={setTax}
                  tip={tip}
                  setTip={setTip}
                  onToggleParticipation={toggleParticipation}
                  onStartNewSplit={startNewSplit}
                />
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;