import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const FillInBlankDragDrop = ({ question, answer, onChange, isDark }) => {
  const { template, blanks, word_bank, allow_reuse } = question.content;
  
  // Initialize selected items for each blank
  const [selectedItems, setSelectedItems] = useState(() => {
    if (answer?.answer) {
      const answerData = typeof answer.answer === 'string' 
        ? JSON.parse(answer.answer) 
        : answer.answer;
      
      const initial = {};
      answerData.blanks?.forEach(b => {
        initial[b.position] = word_bank.find(w => w.id === b.selected_id);
      });
      return initial;
    }
    return {};
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredBlank, setHoveredBlank] = useState(null);

  // Update parent when selection changes
  useEffect(() => {
    const blanksAnswer = blanks.map(blank => ({
      position: blank.position,
      selected_id: selectedItems[blank.position]?.id || ''
    }));
    onChange({ blanks: blanksAnswer });
  }, [selectedItems]);

  // Check if word is already used (if reuse not allowed)
  const isWordUsed = (wordId) => {
    if (allow_reuse) return false;
    return Object.values(selectedItems).some(item => item?.id === wordId);
  };

  const handleDragStart = (e, item) => {
    if (isWordUsed(item.id)) {
      e.preventDefault();
      return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setHoveredBlank(null);
  };

  const handleDragOver = (e, blankPosition) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHoveredBlank(blankPosition);
  };

  const handleDragLeave = () => {
    setHoveredBlank(null);
  };

  const handleDrop = (e, blankPosition) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    setSelectedItems(prev => ({
      ...prev,
      [blankPosition]: draggedItem
    }));
    setDraggedItem(null);
    setHoveredBlank(null);
  };

  const handleRemove = (blankPosition) => {
    setSelectedItems(prev => {
      const newState = { ...prev };
      delete newState[blankPosition];
      return newState;
    });
  };

  // Parse template and create inline blanks
  const renderTemplate = () => {
    const parts = template.split('___');
    const elements = [];
    
    parts.forEach((part, index) => {
      // Add text part
      if (part) {
        elements.push(
          <span key={`text-${index}`} className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
            {part}
          </span>
        );
      }
      
      // Add blank (if not last part)
      if (index < parts.length - 1 && index < blanks.length) {
        const blank = blanks[index];
        const selected = selectedItems[blank.position];
        const isHovered = hoveredBlank === blank.position;
        
        elements.push(
          <span
            key={`blank-${index}`}
            onDragOver={(e) => handleDragOver(e, blank.position)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, blank.position)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 mx-1 rounded-lg border-2 border-dashed
              min-w-[120px] transition-all align-middle
              ${selected
                ? isDark 
                  ? 'bg-blue-900/30 border-blue-500' 
                  : 'bg-blue-50 border-blue-500'
                : isHovered
                ? isDark
                  ? 'bg-blue-900/20 border-blue-400 scale-105'
                  : 'bg-blue-100 border-blue-400 scale-105'
                : isDark
                ? 'bg-gray-700 border-gray-600 hover:border-blue-500'
                : 'bg-gray-50 border-gray-300 hover:border-blue-400'
              }
            `}
          >
            {selected ? (
              <>
                <span className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  {selected.text}
                </span>
                <button
                  onClick={() => handleRemove(blank.position)}
                  className={`p-1 rounded hover:bg-red-500/20 transition-colors`}
                  type="button"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <span className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {blank.hint || 'Drop here'}
              </span>
            )}
          </span>
        );
      }
    });
    
    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
        <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          🎯 Drag words from the word bank below into the blanks
        </p>
      </div>

      {/* Template with inline blanks */}
      <div className={`
        p-6 rounded-xl text-lg leading-loose
        ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
      `}>
        <div className="flex flex-wrap items-center">
          {renderTemplate()}
        </div>
      </div>

      {/* Word Bank */}
      <div>
        <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          📚 Word Bank
        </h3>
        <div className="flex flex-wrap gap-3">
          {word_bank.map(item => {
            const used = isWordUsed(item.id);
            return (
              <div
                key={item.id}
                draggable={!used}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                className={`
                  px-5 py-3 rounded-lg font-bold transition-all text-base
                  ${used
                    ? isDark 
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-40' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-40'
                    : isDark
                    ? 'bg-purple-900 text-purple-200 hover:bg-purple-800 cursor-grab active:cursor-grabbing shadow-lg'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-grab active:cursor-grabbing shadow'
                  }
                  ${draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''}
                `}
              >
                {item.text}
              </div>
            );
          })}
        </div>
        {!allow_reuse && (
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            💡 Each word can only be used once
          </p>
        )}
      </div>

      {/* Mobile/Touch hint */}
      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-center`}>
        💡 Drag and drop the words into the blanks above
      </div>
    </div>
  );
};

export default FillInBlankDragDrop;
