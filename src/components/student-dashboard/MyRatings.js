import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function MyRatings({ user }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'feedbacks'), where('studentId', '==', user.uid));
        const snap = await getDocs(q);
        setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching ratings", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchRatings();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rating?")) return;
    try {
      // Soft delete preference from prompt, but standard delete is often cleaner. 
      // Prompt said "Soft delete -> mark as deleted: true".
      await updateDoc(doc(db, 'feedbacks', id), { deleted: true });
      setRatings(ratings.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading) return <div className="glass-card" style={{padding:40}}>Loading...</div>;

  const activeRatings = ratings.filter(r => !r.deleted);

  return (
    <div className="my-ratings-page">
      <h2 style={{marginBottom: 30}}>My Ratings ({activeRatings.length})</h2>
      
      <div className="ratings-list-layout">
        {activeRatings.map(rating => (
          <div key={rating.id} className="glass-card rating-item" style={{padding: 20}}>
            <div className="instructor-photo" style={{width:60, height:60, background:'#e0e7ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:20}}>
               {(rating.instructorName || 'T').charAt(0)}
            </div>
            
            <div className="rating-content">
               <h4 style={{margin:0}}>{rating.instructorName}</h4>
               <p style={{margin:'4px 0', opacity:0.7, fontSize:14}}>{rating.courseTitle}</p>
               <div style={{display:'flex', alignItems:'center', gap:10, margin:'8px 0'}}>
                  <span style={{fontWeight:'bold', color:'#fbbf24', fontSize:18}}>{rating.rating} ★</span>
                  <span style={{fontSize:12, opacity:0.5}}>{new Date(rating.createdAt?.seconds * 1000).toLocaleDateString()}</span>
               </div>
               <p style={{fontStyle:'italic', opacity:0.8}}>"{rating.feedback}"</p>
               <div className="tags-row" style={{display:'flex', gap:5, marginTop:10}}>
                  {rating.tags && rating.tags.map(t => (
                      <span key={t} style={{fontSize:10, padding:'2px 8px', background:'rgba(0,0,0,0.05)', borderRadius:10}}>{t}</span>
                  ))}
               </div>
               {/* Reaction Summary */}
               <div style={{marginTop: 10, fontSize: 12, opacity: 0.6, display: 'flex', gap: 15}}>
                   <span>👍 {rating.likesCount || 0} Likes</span>
                   <span>👎 {rating.dislikesCount || 0} Dislikes</span>
                   <span>💬 {rating.repliesCount || 0} Replies</span>
               </div>
            </div>

            <div className="rating-actions">
               <button className="icon-btn edit-btn" title="Edit">✎</button>
               <button className="icon-btn delete-btn" title="Delete" onClick={() => handleDelete(rating.id)}>🗑</button>
            </div>
          </div>
        ))}

        {activeRatings.length === 0 && (
            <div style={{textAlign:'center', padding: 40, opacity: 0.6}}>You haven't submitted any ratings yet.</div>
        )}
      </div>
    </div>
  );
}
