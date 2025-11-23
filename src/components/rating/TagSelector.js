import React from 'react';

const TAGS = [
  "Helpful", "Strict", "Organized", "Inspiring", 
  "Knowledgeable", "Friendly", "Punctual", 
  "Gives Good Examples", "Hard Grader"
];

const TagSelector = ({ selectedTags, setSelectedTags, readOnly = false }) => {
  
  const toggleTag = (tag) => {
    if (readOnly) return;
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="tag-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0' }}>
      {TAGS.map(tag => (
        <span
          key={tag}
          onClick={() => toggleTag(tag)}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: readOnly ? 'default' : 'pointer',
            border: '1px solid',
            borderColor: selectedTags.includes(tag) ? '#6366f1' : '#cbd5e1',
            backgroundColor: selectedTags.includes(tag) ? '#6366f1' : 'transparent',
            color: selectedTags.includes(tag) ? 'white' : 'inherit',
            transition: 'all 0.2s ease',
            boxShadow: selectedTags.includes(tag) ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none'
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

export default TagSelector;
