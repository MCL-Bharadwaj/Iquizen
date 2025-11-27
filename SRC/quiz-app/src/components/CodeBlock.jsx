import React from 'react';

/**
 * CodeBlock component for displaying formatted code snippets
 * Detects code patterns and renders them with proper syntax highlighting
 */
const CodeBlock = ({ children, isDark }) => {
  return (
    <pre className={`rounded-lg p-4 overflow-x-auto font-mono text-sm ${
      isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'
    }`}>
      <code>{children}</code>
    </pre>
  );
};

/**
 * QuestionText component that automatically detects and formats code snippets
 * Supports inline code (backticks) and code blocks (triple backticks)
 */
export const QuestionText = ({ text, isDark, className = '' }) => {
  // Pattern to match code blocks with triple backticks or code tags
  const codeBlockPattern = /```[\s\S]*?```|`[^`]+`/g;
  
  const renderContent = () => {
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Find all code blocks
    const regex = new RegExp(codeBlockPattern);
    while ((match = regex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      const codeContent = match[0];
      
      // Handle triple backtick code blocks
      if (codeContent.startsWith('```')) {
        const code = codeContent.replace(/```\w*\n?/g, '').replace(/```$/g, '');
        parts.push(
          <CodeBlock key={`code-${match.index}`} isDark={isDark}>
            {code}
          </CodeBlock>
        );
      } 
      // Handle inline code with single backticks
      else if (codeContent.startsWith('`')) {
        const code = codeContent.replace(/`/g, '');
        parts.push(
          <code
            key={`inline-${match.index}`}
            className={`px-2 py-1 rounded font-mono text-sm ${
              isDark ? 'bg-gray-700 text-blue-300' : 'bg-gray-200 text-blue-600'
            }`}
          >
            {code}
          </code>
        );
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
};

export default CodeBlock;
