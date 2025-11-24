import React, { useState } from 'react';
import { Friend, DietType, SavedSplit } from '../types';
import { DIET_LABELS } from '../constants';
import { DietBadge } from './DietBadge';
import { Plus, X, User, History, Calendar, Eye } from 'lucide-react';

interface FriendListProps {
  friends: Friend[];
  history: SavedSplit[];
  onAddFriend: (friend: Omit<Friend, 'id' | 'avatarUrl'>) => void;
  onRemoveFriend: (id: string) => void;
  onLoadHistorySplit: (split: SavedSplit) => void;
}

export const FriendList: React.FC<FriendListProps> = ({ friends, history, onAddFriend, onRemoveFriend, onLoadHistorySplit }) => {
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendDiet, setNewFriendDiet] = useState<DietType>(DietType.EVERYTHING);
  const [view, setView] = useState<'current' | 'history'>('current');

  const handleAdd = () => {
    if (!newFriendName.trim()) return;
    onAddFriend({ name: newFriendName, diet: newFriendDiet });
    setNewFriendName('');
    setNewFriendDiet(DietType.EVERYTHING);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {view === 'current' ? <User className="w-5 h-5 text-indigo-500" /> : <History className="w-5 h-5 text-indigo-500" />}
          {view === 'current' ? 'The Group' : 'Split History'}
        </h2>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setView('current')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'current' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Current
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            History
          </button>
        </div>
      </div>

      {view === 'current' ? (
        <>
          <div className="pb-4 mb-2 border-b border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Add New Person</label>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Name (e.g., Sarah)"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-2">
                <select
                  value={newFriendDiet}
                  onChange={(e) => setNewFriendDiet(e.target.value as DietType)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-sm flex-1"
                >
                  <option value={DietType.EVERYTHING}>{DIET_LABELS[DietType.EVERYTHING]}</option>
                  <option value={DietType.VEGETARIAN}>{DIET_LABELS[DietType.VEGETARIAN]}</option>
                  <option value={DietType.VEGAN}>{DIET_LABELS[DietType.VEGAN]}</option>
                </select>
                <button
                  onClick={handleAdd}
                  disabled={!newFriendName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex justify-between items-center px-1 mb-2">
               <span className="text-xs text-gray-400">{friends.length} people added</span>
            </div>
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800">{friend.name}</p>
                    <DietBadge type={friend.diet} />
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFriend(friend.id)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  aria-label="Remove friend"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {friends.length === 0 && (
              <div className="text-center py-8 text-gray-400 italic">
                Add friends to start splitting!
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length > 0 ? (
            history.map((split) => (
              <div key={split.id} className="group relative p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    {formatDate(split.date)}
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    ${split.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {split.friends.slice(0, 5).map((f) => (
                      <img 
                        key={f.id} 
                        src={f.avatarUrl} 
                        alt={f.name} 
                        className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"
                        title={f.name}
                      />
                    ))}
                    {split.friends.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                        +{split.friends.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{split.dishCount} dishes</p>
                  </div>
                </div>

                {/* Hover Action */}
                <button
                  onClick={() => onLoadHistorySplit(split)}
                  className="absolute top-3 right-3 p-1.5 bg-white text-indigo-600 rounded-lg border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-50"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <History className="w-12 h-12 mb-3 opacity-20" />
              <p className="italic">No history yet.</p>
              <p className="text-xs mt-1">Complete a split to see it here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};