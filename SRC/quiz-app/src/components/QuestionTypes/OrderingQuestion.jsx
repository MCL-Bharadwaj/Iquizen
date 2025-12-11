import { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

const OrderingQuestion = ({ question, answer, onChange, isDark }) => {
  const orderItems = question.content.items || [];
  const prevQuestionIdRef = useRef(null);
  
  // Shuffle function
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Initialize with shuffled items or current answer
  const [items, setItems] = useState(() => {
    if (answer?.answer) {
      // If there's already an answer, use that order
      const answerOrder = typeof answer.answer === 'string' 
        ? JSON.parse(answer.answer).order 
        : answer.answer.order;
      return answerOrder.map(id => orderItems.find(item => item.id === id)).filter(Boolean);
    }
    // Otherwise, shuffle the items (always shuffle for new questions)
    return shuffleArray([...orderItems]);
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    // Only reset if question actually changed
    if (prevQuestionIdRef.current !== question.questionId) {
      prevQuestionIdRef.current = question.questionId;
      setHasInteracted(false);
      
      if (answer?.answer) {
        // If there's already an answer, use that order
        const answerOrder = typeof answer.answer === 'string' 
          ? JSON.parse(answer.answer).order 
          : answer.answer.order;
        const orderedItems = answerOrder.map(id => orderItems.find(item => item.id === id)).filter(Boolean);
        if (orderedItems.length > 0) {
          setItems(orderedItems);
        }
      } else {
        // Otherwise, ALWAYS shuffle the items for this new question
        if (orderItems.length > 0) {
          setItems(shuffleArray([...orderItems]));
        }
      }
      setDraggedItem(null);
      setDragOverIndex(null);
    }
  }, [question.questionId, answer]); // Add dependencies to prevent infinite loop

  // Update parent when items change (only after user interaction)
  useEffect(() => {
    if (hasInteracted) {
      const order = items.map(item => item.id);
      onChange({ order }, null);
    }
  }, [items, hasInteracted]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItemData = newItems[draggedItem];
    
    // Remove dragged item
    newItems.splice(draggedItem, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItemData);
    
    setHasInteracted(true);
    setItems(newItems);
    setDragOverIndex(null);
  };

  // Assign letters to items for display
  const getItemLetter = (index) => {
    return String.fromCharCode(80 + index); // P, Q, R, S, T...
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
        <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          📝 Drag and drop the items below to arrange them in the correct order
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 cursor-move transition-all
              ${dragOverIndex === index && draggedItem !== index
                ? isDark 
                  ? 'border-blue-500 bg-blue-900/30 scale-105' 
                  : 'border-blue-500 bg-blue-100 scale-105'
                : isDark
                ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                : 'border-gray-200 bg-white hover:bg-gray-50'
              }
              ${draggedItem === index ? 'opacity-50' : ''}
            `}
          >
            <GripVertical className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0
              ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}
            `}>
              {index + 1}
            </div>

            <div className="flex-1">
              <span className={`font-bold mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {getItemLetter(orderItems.findIndex(i => i.id === item.id))}:
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
        💡 Tip: Click and drag the items to reorder them
      </div>
    </div>
  );
};

export default OrderingQuestion;
