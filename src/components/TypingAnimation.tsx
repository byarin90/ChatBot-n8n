import React, { useState, useEffect } from 'react';
import LinkButton from './LinkButton';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

interface ParsedElement {
  type: 'text' | 'link';
  content: string;
  linkText?: string;
  linkUrl?: string;
  startIndex: number;
  endIndex: number;
  displayStartIndex: number; // מיקום ההתחלה למטרות התצוגה
  displayLength: number; // אורך הטקסט שצריך להציג (בלי markdown)
}

// פונקציה לפרסור הטקסט מראש ויצירת רשימת אלמנטים
const parseTextElements = (text: string): ParsedElement[] => {
  const elements: ParsedElement[] = [];
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  let lastIndex = 0;
  let displayIndex = 0; // מונה לתצוגה (בלי markdown)
  let match;
  
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // טקסט רגיל לפני הלינק
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      elements.push({
        type: 'text',
        content: textContent,
        startIndex: lastIndex,
        endIndex: match.index,
        displayStartIndex: displayIndex,
        displayLength: textContent.length
      });
      displayIndex += textContent.length;
    }
    
    // לינק - רק אורך הטקסט הנראה
    const linkText = match[1];
    elements.push({
      type: 'link',
      content: match[0], // הטקסט המלא [text](url)
      linkText: linkText,
      linkUrl: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      displayStartIndex: displayIndex,
      displayLength: linkText.length // רק אורך הטקסט הנראה!
    });
    displayIndex += linkText.length;
    
    lastIndex = match.index + match[0].length;
  }
  
  // שארית הטקסט
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex);
    elements.push({
      type: 'text',
      content: textContent,
      startIndex: lastIndex,
      endIndex: text.length,
      displayStartIndex: displayIndex,
      displayLength: textContent.length
    });
  }
  
  return elements;
};

export const TypingAnimation: React.FC<TypingAnimationProps> = ({ 
  text, 
  speed = 30, 
  onComplete
}) => {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [parsedElements] = useState(() => parseTextElements(text));
  
  // חישוב האורך הכולל למטרות תצוגה (בלי markdown)
  const totalDisplayLength = parsedElements.reduce((sum, el) => sum + el.displayLength, 0);

  useEffect(() => {
    if (displayIndex < totalDisplayLength) {
      const timeout = setTimeout(() => {
        setDisplayIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (displayIndex === totalDisplayLength && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayIndex, totalDisplayLength, speed, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayIndex(0);
    setIsComplete(false);
  }, [text]);

  // רנדור אלמנטים בהתאם למיקום התצוגה הנוכחי
  const renderElements = () => {
    const renderedElements: React.ReactNode[] = [];
    
    for (const element of parsedElements) {
      if (displayIndex < element.displayStartIndex) {
        // עדיין לא הגענו לאלמנט הזה
        break;
      }
      
      if (element.type === 'text') {
        // טקסט רגיל - מציגים עד המיקום הנוכחי
        const visibleLength = Math.min(displayIndex - element.displayStartIndex, element.displayLength);
        if (visibleLength > 0) {
          renderedElements.push(
            <span key={element.startIndex}>
              {element.content.slice(0, visibleLength)}
            </span>
          );
        }
      } else if (element.type === 'link') {
        // לינק - מציגים את הכפתור מיד ומטייפים רק את הטקסט הנראה
        if (displayIndex >= element.displayStartIndex) {
          // חישוב כמה תווים מהטקסט הנראה צריך להציג
          const visibleLength = Math.min(displayIndex - element.displayStartIndex, element.displayLength);
          const visibleLinkText = (element.linkText || '').slice(0, visibleLength);
          
          renderedElements.push(
            <LinkButton icon='🔗' key={element.startIndex} href={element.linkUrl || '#'}>
              {visibleLinkText}
            </LinkButton>
          );
        }
      }
    }
    
    return renderedElements;
  };

  return <>{renderElements()}</>;
};
