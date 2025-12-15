import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function RatingModal({ course, user, onClose }) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const availableTags = ['Helpful', 'Organized', 'Strict', 'Friendly', 'Knowledgeable', 'Engaging'];

  const toggleTag = (tag) => {
    if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
    else setTags([...tags, tag]);
  };

  const handleSubmit = async () => {
    if (rating === 0) return alert('Please select a rating.');
    setLoading(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        studentId: user.uid,
        studentName: user.displayName || 'Anonymous',
        instructorName: course.instructors,
        // instructorId: course.instructorId // Ideally we have this mapped
        courseId: course.courseNo,
        courseTitle: course.courseTitle,
        deptName: course.dept,
        rating: rating,
        overall: rating, // Standardizing field name
        tags: tags,
        feedback: feedback,
        text: feedback, // Schema alignment
        comment: feedback, // Alias for compatibility
        status: 'published',
        meta: {
            likes: 0, 
            dislikes: 0, 
            hasReply: false
        },
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      });
      alert('Rating submitted successfully!');
      onClose();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert('Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <h2 style={{marginTop:0}}>Rate {course.instructors}</h2>
        <p style={{opacity: 0.7}}>{course.courseTitle}</p>

        <div className="star-rating-lg">
          {[1, 2, 3, 4, 5].map(star => (
            <span 
              key={star} 
              className={`star ${star <= rating ? 'active' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <h4>Select Tags</h4>
        <div className="tags-container">
          {availableTags.map(tag => (
            <button 
              key={tag} 
              className={`tag-chip ${tags.includes(tag) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <h4>Written Feedback</h4>
        <textarea 
          className="modern-input" // Using global style or will add inline
          style={{width: '100%', minHeight: 100, padding: 12, borderRadius: 12, border: '1px solid #ccc'}}
          placeholder="Share your experience with this instructor..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  );
}
