import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FillInBlankDragDrop = ({ question, answer, onChange, isDark }) => {
  // Handle nested content structure (sometimes content.content exists due to import issues)
  let content = question?.content || {};
  
  // Check if content has a nested content property and use that instead
  if (content.content && typeof content.content === 'object') {
    content = content.content;
  }
  
  const template = content.template || '';
  const blanks = content.blanks || [];
  const word_bank = content.word_bank || [];
  const wordBank = content.wordBank || [];
  const allow_reuse = content.allow_reuse || content.allowReuse || false;
  
  // Support both word_bank (snake_case) and wordBank (camelCase)
  let wordBankArray = word_bank.length > 0 ? word_bank : wordBank;
  
  // Convert old format (value/label) to new format (id/text) if needed
  wordBankArray = wordBankArray.map(item => {
    if (item.value && item.label && !item.id && !item.text) {
      return {
        id: item.value,
        text: item.label,
        category: item.category
      };
    }
    return item;
  });
  
  const prevQuestionIdRef = useRef(null);
  
  // Early return if required data is missing
  if (!template || blanks.length === 0 || wordBankArray.length === 0) {
    console.error('FillInBlankDragDrop - Missing data:', { 
      hasTemplate: !!template, 
      blanksCount: blanks.length, 
      wordBankCount: wordBankArray.length,
      content: content 
    });
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        <p className="text-center">⚠️ Question data incomplete. Missing template, blanks, or word bank.</p>
      </div>
    );
  }
  
  // Initialize selected items for each blank
  const [selectedItems, setSelectedItems] = useState(() => {
    if (answer?.answer) {
      const answerData = typeof answer.answer === 'string' 
        ? JSON.parse(answer.answer) 
        : answer.answer;
      
      const initial = {};
      answerData.blanks?.forEach(b => {
        initial[b.position] = wordBankArray.find(w => w.id === b.selected_id);
      });
      return initial;
    }
    return {};
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredBlank, setHoveredBlank] = useState(null);

  // Reset state when question changes
  useEffect(() => {
    // Only reset if question actually changed
    if (prevQuestionIdRef.current !== question.questionId) {
      prevQuestionIdRef.current = question.questionId;
      
      if (answer?.answer) {
        const answerData = typeof answer.answer === 'string' 
          ? JSON.parse(answer.answer) 
          : answer.answer;
        
        const initial = {};
        if (answerData.blanks && Array.isArray(answerData.blanks)) {
          answerData.blanks.forEach(b => {
            const foundWord = wordBankArray.find(w => w.id === b.selected_id);
            if (foundWord) {
              initial[b.position] = foundWord;
            }
          });
        }
        setSelectedItems(initial);
      } else {
        setSelectedItems({});
      }
      setDraggedItem(null);
      setHoveredBlank(null);
    }
  });

  // Update parent when selection changes
  useEffect(() => {
    // Backend expects: {"blanks": [{"position": 1, "selected_id": "op1"}, ...]}
    // Backend compares selected_id against accepted_answers, which may contain text or id
    const blanksArray = blanks.map(blank => {
      const selected = selectedItems[blank.position];
      return {
        position: blank.position,
        selected_id: selected ? selected.text : '' // Send text value for grading
      };
    });
    
    // Send in the format expected by backend
    onChange({ blanks: blanksArray });
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
    // Check if template contains code blocks (triple backticks)
    const codeBlockMatch = template.match(/```(\w+)?\n([\s\S]*?)```/);
    
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || '';
      const codeContent = codeBlockMatch[2];
      const parts = codeContent.split('___');
      const elements = [];
      
      parts.forEach((part, index) => {
        // Add code text part
        if (part) {
          elements.push(
            <span key={`text-${index}`} className="whitespace-pre">
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
                inline-flex items-center gap-2 px-3 py-1 mx-1 rounded border-2 border-dashed
                min-w-[100px] transition-all font-mono text-sm
                ${selected
                  ? isDark 
                    ? 'bg-blue-900/40 border-blue-400' 
                    : 'bg-blue-100 border-blue-500'
                  : isHovered
                  ? isDark
                    ? 'bg-blue-900/30 border-blue-300 scale-105'
                    : 'bg-blue-50 border-blue-400 scale-105'
                  : isDark
                  ? 'bg-gray-800 border-gray-600 hover:border-blue-500'
                  : 'bg-gray-100 border-gray-400 hover:border-blue-400'
                }
              `}
            >
              {selected ? (
                <>
                  <span className={`font-bold ${isDark ? 'text-yellow-300' : 'text-purple-700'}`}>
                    {selected.text}
                  </span>
                  <button
                    onClick={() => handleRemove(blank.position)}
                    className={`p-0.5 rounded hover:bg-red-500/20 transition-colors`}
                    type="button"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </>
              ) : (
                <span className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                  drop
                </span>
              )}
            </span>
          );
        }
      });
      
      return (
        <div className={`
          font-mono text-sm leading-relaxed p-6 rounded-lg
          ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}
          overflow-x-auto
        `}>
          {language && (
            <div className={`text-xs mb-3 pb-2 border-b ${isDark ? 'text-gray-500 border-gray-700' : 'text-gray-600 border-gray-300'}`}>
              {language}
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {elements}
          </div>
        </div>
      );
    }
    
    // Regular template (non-code)
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
                Drop here
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
          {wordBankArray.map(item => {
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
