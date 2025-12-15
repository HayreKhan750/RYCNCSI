import React from 'react';

const FilterButton = ({ active, label, onClick, icon }) => (
    <button 
        onClick={onClick}
        className={`filter-btn ${active ? 'active' : ''}`}
    >
        {icon && <span>{icon}</span>}
        {label}
    </button>
);

const ReviewsFilterBar = ({ filters, onFilterChange }) => {
    return (
        <div className="reviews-filter-bar">
            <FilterButton 
                label="All Reviews" 
                active={filters.rating === 'all'} 
                onClick={() => onFilterChange('rating', 'all')}
            />
            
            <div className="filter-divider"></div>

            <FilterButton 
                label="Positive (4-5★)" 
                icon="😊"
                active={filters.rating === 'positive'} 
                onClick={() => onFilterChange('rating', 'positive')}
            />
             <FilterButton 
                label="Critical (1-3★)" 
                icon="😟"
                active={filters.rating === 'critical'} 
                onClick={() => onFilterChange('rating', 'critical')}
            />

            <div className="filter-divider"></div>

            <div className="filter-select-wrapper">
                <select 
                    className="filter-select"
                    onChange={(e) => onFilterChange('course', e.target.value)}
                    value={filters.course}
                >
                    <option value="all">All Courses</option>
                    <option value="cs101">CS101 - Intro to Programming</option>
                    <option value="cs202">CS202 - Data Structures</option>
                </select>
                <div className="select-arrow">
                    ▼
                </div>
            </div>
        </div>
    );
};

export default ReviewsFilterBar;
