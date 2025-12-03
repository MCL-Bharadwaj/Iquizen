import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const MatchingQuestion = ({ question, answer, onChange, isDark }) => {
  const leftItems = question.content.leftItems || question.content.left_items || [];
  const rightItems = question.content.rightItems || question.content.right_items || [];
  const prevQuestionIdRef = useRef(null);
  
  // Store pairs as { leftId: rightId }
  const [pairs, setPairs] = useState(() => {
    if (answer?.answer?.pairs) {
      const pairMap = {};
      answer.answer.pairs.forEach(pair => {
        pairMap[pair.left] = pair.right;
      });
      return pairMap;
    }
    return {};
  });

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [hoveredRight, setHoveredRight] = useState(null);
  const svgRef = useRef(null);
  const leftRefs = useRef({});
  const rightRefs = useRef({});

  // Reset state when question changes
  useEffect(() => {
    // Only reset if question actually changed
    if (prevQuestionIdRef.current !== question.questionId) {
      prevQuestionIdRef.current = question.questionId;
      
      if (answer?.answer?.pairs && Array.isArray(answer.answer.pairs)) {
        const pairMap = {};
        answer.answer.pairs.forEach(pair => {
          pairMap[pair.left] = pair.right;
        });
        setPairs(pairMap);
      } else {
        setPairs({});
      }
      setSelectedLeft(null);
      setHoveredRight(null);
    }
  });

  // Update parent when pairs change
  useEffect(() => {
    const pairArray = Object.entries(pairs).map(([left, right]) => ({
      left,
      right
    }));
    onChange({ pairs: pairArray }, null);
  }, [pairs]);

  const handleLeftClick = (leftId) => {
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightClick = (rightId) => {
    if (selectedLeft) {
      setPairs(prev => ({
        ...prev,
        [selectedLeft]: rightId
      }));
      setSelectedLeft(null);
    }
  };

  const handleClearPair = (leftId) => {
    setPairs(prev => {
      const newPairs = { ...prev };
      delete newPairs[leftId];
      return newPairs;
    });
  };

  const getPosition = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const container = svgRef.current?.getBoundingClientRect();
    if (!container) return null;
    
    return {
      x: rect.left - container.left + rect.width / 2,
      y: rect.top - container.top + rect.height / 2
    };
  };

  const renderLines = () => {
    if (!svgRef.current) return null;

    const lines = [];
    Object.entries(pairs).forEach(([leftId, rightId]) => {
      const leftPos = getPosition(leftRefs.current[leftId]);
      const rightPos = getPosition(rightRefs.current[rightId]);
      
      if (leftPos && rightPos) {
        lines.push(
          <g key={`${leftId}-${rightId}`}>
            <line
              x1={leftPos.x}
              y1={leftPos.y}
              x2={rightPos.x}
              y2={rightPos.y}
              stroke={isDark ? '#60a5fa' : '#3b82f6'}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx={leftPos.x}
              cy={leftPos.y}
              r="6"
              fill={isDark ? '#60a5fa' : '#3b82f6'}
            />
            <circle
              cx={rightPos.x}
              cy={rightPos.y}
              r="6"
              fill={isDark ? '#60a5fa' : '#3b82f6'}
            />
          </g>
        );
      }
    });

    return lines;
  };

  const isRightItemMatched = (rightId) => {
    return Object.values(pairs).includes(rightId);
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
        <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          🔗 Click an item from Column A, then click the matching item from Column B to connect them
        </p>
      </div>

      <div className="relative">
        {/* SVG for drawing lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {renderLines()}
        </svg>

        {/* Matching interface */}
        <div className="grid grid-cols-2 gap-16 relative" style={{ zIndex: 1 }}>
          {/* Column A (Left Items) */}
          <div>
            <h3 className={`text-lg font-bold mb-4 text-center ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Column A
            </h3>
            <div className="space-y-3">
              {leftItems.map((item, index) => {
                const isSelected = selectedLeft === item.id;
                const isMatched = pairs[item.id];
                const matchedRightItem = isMatched ? rightItems.find(r => r.id === pairs[item.id]) : null;

                return (
                  <div
                    key={item.id}
                    ref={el => leftRefs.current[item.id] = el}
                    onClick={() => handleLeftClick(item.id)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected
                        ? isDark
                          ? 'border-blue-500 bg-blue-900/40 shadow-lg scale-105'
                          : 'border-blue-500 bg-blue-100 shadow-lg scale-105'
                        : isMatched
                        ? isDark
                          ? 'border-green-700 bg-green-900/20'
                          : 'border-green-300 bg-green-50'
                        : isDark
                        ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`
                          font-bold text-lg
                          ${isMatched
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-blue-400' : 'text-blue-600'
                          }
                        `}>
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.text}
                        </span>
                      </div>
                      {isMatched && (
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-500" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearPair(item.id);
                            }}
                            className={`text-xs px-2 py-1 rounded ${
                              isDark
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    {isMatched && matchedRightItem && (
                      <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        → Matched with: <span className="font-medium">{matchedRightItem.text}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column B (Right Items) */}
          <div>
            <h3 className={`text-lg font-bold mb-4 text-center ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Column B
            </h3>
            <div className="space-y-3">
              {rightItems.map((item, index) => {
                const isMatched = isRightItemMatched(item.id);
                const isHovered = hoveredRight === item.id;

                return (
                  <div
                    key={item.id}
                    ref={el => rightRefs.current[item.id] = el}
                    onClick={() => handleRightClick(item.id)}
                    onMouseEnter={() => setHoveredRight(item.id)}
                    onMouseLeave={() => setHoveredRight(null)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedLeft && !isMatched
                        ? isHovered
                          ? isDark
                            ? 'border-blue-500 bg-blue-900/40 shadow-lg scale-105'
                            : 'border-blue-500 bg-blue-100 shadow-lg scale-105'
                          : isDark
                          ? 'border-blue-700 bg-gray-800 hover:bg-gray-700'
                          : 'border-blue-300 bg-white hover:bg-gray-50'
                        : isMatched
                        ? isDark
                          ? 'border-green-700 bg-green-900/20 cursor-default'
                          : 'border-green-300 bg-green-50 cursor-default'
                        : isDark
                        ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-60'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`
                        font-bold text-lg
                        ${isMatched
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-blue-400' : 'text-blue-600'
                        }
                      `}>
                        {index + 1}.
                      </span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.text}
                      </span>
                      {isMatched && <Check className="w-5 h-5 text-green-500 ml-auto" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className={`text-center p-3 rounded-xl ${
        Object.keys(pairs).length === leftItems.length
          ? isDark
            ? 'bg-green-900/20 border-green-700 text-green-400'
            : 'bg-green-50 border-green-200 text-green-700'
          : isDark
          ? 'bg-gray-800 text-gray-400'
          : 'bg-gray-100 text-gray-600'
      } border`}>
        {Object.keys(pairs).length === leftItems.length
          ? '✅ All items matched!'
          : `📊 Matched: ${Object.keys(pairs).length} / ${leftItems.length}`
        }
      </div>

      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
        💡 Tip: {selectedLeft 
          ? 'Now click an item from Column B to complete the match' 
          : 'Click an item from Column A to start matching'}
      </div>
    </div>
  );
};

export default MatchingQuestion;
