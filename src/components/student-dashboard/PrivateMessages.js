import React, { useEffect, useState, useRef } from 'react';
import { messageService } from '../../services/messageService';
import SkeletonLoader from '../common/SkeletonLoader';

export default function PrivateMessages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null); // The user object we are chatting with
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  
  const scrollRef = useRef(null);

  // 1. Load Conversations
  useEffect(() => {
    if (user?.uid) {
        loadConversations();
    }
  }, [user]);

  const loadConversations = () => {
      messageService.fetchConversations(user.uid)
        .then(setConversations)
        .catch(console.error)
        .finally(() => setLoading(false));
  };

  // 2. Load Thread & Deep Linking
  useEffect(() => {
      // Handle Deep Linking from URL
      const searchParams = new URLSearchParams(window.location.search);
      const partnerIdParam = searchParams.get('partnerId');

      if (partnerIdParam && user?.uid && !activePartner) {
          // Check if already in conversations
          const existing = conversations.find(c => c.userId === partnerIdParam);
          if (existing) {
              setActivePartner(existing);
          } else {
              // Not in list? Create temporary partner object (fetch name if possible)
              // For now, minimal stub or fetch from service
              // Ideally fetch from 'users' collection to get name/photo
              import('../../services/instructorService').then(async ({ instructorService }) => {
                 try {
                     const profile = await instructorService.fetchInstructorProfile(partnerIdParam);
                     if (profile && !profile.error) {
                         const tempPartner = {
                             userId: partnerIdParam,
                             name: profile.profile.instructorName || profile.profile.fullName || 'Instructor',
                             photo: profile.profile.profilePictureUrl || profile.profile.photoURL,
                             isTemp: true
                         };
                         setActivePartner(tempPartner);
                         // Optional: Add to conversations list temporarily so it appears in sidebar
                         setConversations(prev => [tempPartner, ...prev]);
                     }
                 } catch (e) {
                     console.error("Failed to fetch partner details", e);
                     // Fallback
                     setActivePartner({ userId: partnerIdParam, name: 'Instructor', isTemp: true });
                 }
              });
          }
      }
  }, [conversations, user, activePartner]); // Run when conversations load

  // Load Thread when a partner is selected
  useEffect(() => {
      if (activePartner && user?.uid) {
          const interval = setInterval(() => {
             // Simple polling for realtime updates (simplest for now without snapshot listeners everywhere)
             // Or just fetch once. Let's fetch once for now + CRUD.
          }, 5000);

          messageService.fetchThread(user.uid, activePartner.userId)
              .then(msgs => {
                  setThread(msgs);
                  // Mark unread as read
                  msgs.forEach(m => {
                      if (!m.read && m.receiverId === user.uid) {
                          messageService.markAsRead(m.id);
                      }
                  });
              });
              
          return () => clearInterval(interval);
      }
  }, [activePartner, user]);

  // Auto-scroll to bottom
  useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSend = async () => {
      if (!replyText.trim() || !activePartner) return;
      
      try {
          // Optimistic append
          const tempMsg = {
              id: Date.now().toString(),
              text: replyText,
              senderId: user.uid,
              senderName: user.displayName || 'Me',
              createdAt: new Date(), // JS Date for local display
              participants: [user.uid, activePartner.userId]
          };
          setThread(prev => [...prev, tempMsg]);
          setReplyText('');

          await messageService.sendMessage({
              senderId: user.uid,
              senderName: user.displayName || user.name || 'Student',
              receiverId: activePartner.userId,
              text: tempMsg.text // use original text
          });
          
          // Refresh conversations to update "Last Message"
          loadConversations();
      } catch (e) {
          console.error("Failed to send", e);
          alert("Failed to send message");
      }
  };
  
  const timeAgo = (date) => {
      if (!date) return '';
      const d = (date.seconds) ? new Date(date.seconds * 1000) : new Date(date);
      return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  if (loading) return (
      <div className="glass-card" style={{padding: 24}}>
          <SkeletonLoader height="60px" style={{marginBottom:12}} />
          <SkeletonLoader height="60px" style={{marginBottom:12}} />
      </div>
  );

  return (
    <div className="private-messages-page" style={{height: 'calc(100vh - 150px)', display: 'flex', gap: 20}}>
       
       {/* Sidebar: Conversations List */}
       <div className="conversations-list glass-card" style={{
           width: 300, 
           display: 'flex', flexDirection: 'column', 
           padding: 0, overflow: 'hidden', flexShrink: 0
       }}>
           <div style={{padding: '20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)'}}>
               <h3 style={{margin:0}}>Messages</h3>
           </div>
           
           <div style={{flex: 1, overflowY: 'auto', padding: '10px'}}>
               {conversations.length === 0 ? (
                   <div style={{textAlign:'center', padding: 20, opacity: 0.5, fontSize: '0.9rem'}}>No conversations yet</div>
               ) : (
                   conversations.map(c => (
                       <div key={c.userId} 
                           onClick={() => setActivePartner(c)}
                           style={{
                               padding: '12px', borderRadius: '12px', marginBottom: 8,
                               background: activePartner?.userId === c.userId ? 'var(--primary)' : 'transparent',
                               cursor: 'pointer', transition: 'all 0.2s',
                               color: activePartner?.userId === c.userId ? 'white' : 'var(--text-primary)'
                           }}
                       >
                           <div style={{display:'flex', justifyContent:'space-between', marginBottom: 4}}>
                               <span style={{fontWeight: 600, fontSize: '0.95rem'}}>{c.name}</span>
                               <span style={{fontSize: '0.75rem', opacity: 0.7}}>
                                   {c.lastMessage?.createdAt ? timeAgo(c.lastMessage.createdAt) : ''}
                               </span>
                           </div>
                           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                               <span style={{
                                   fontSize: '0.85rem', opacity: 0.8, 
                                   whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px'
                               }}>
                                   {c.lastMessage?.senderId === user.uid ? 'You: ' : ''}
                                   {c.lastMessage?.text}
                               </span>
                               {c.unreadCount > 0 && (
                                   <span style={{
                                       background: activePartner?.userId === c.userId ? 'white' : 'var(--primary)', 
                                       color: activePartner?.userId === c.userId ? 'var(--primary)' : 'white',
                                       borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem',
                                       display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                   }}>
                                       {c.unreadCount}
                                   </span>
                               )}
                           </div>
                       </div>
                   ))
               )}
           </div>
       </div>

       {/* Main Chat Area */}
       <div className="chat-area glass-card" style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0}}>
           {activePartner ? (
               <>
                   {/* Chat Header */}
                   <div style={{
                       padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', 
                       background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 12
                   }}>
                       <div style={{
                           width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-gradient)',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'
                       }}>
                           {activePartner.name?.[0]}
                       </div>
                       <div>
                           <h3 style={{margin:0, fontSize: '1.1rem'}}>{activePartner.name}</h3>
                           <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6}}>
                               <span style={{width: 8, height: 8, borderRadius: '50%', background: '#4ade80'}}></span> Online
                           </span>
                       </div>
                   </div>

                   {/* Messages */}
                   <div style={{flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16}}>
                       {thread.map((msg, idx) => {
                           const isMe = msg.senderId === user.uid;
                           return (
                               <div key={idx} style={{
                                   alignSelf: isMe ? 'flex-end' : 'flex-start',
                                   maxWidth: '70%',
                               }}>
                                   <div style={{
                                       padding: '12px 16px', 
                                       borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                       background: isMe ? 'var(--primary-gradient)' : 'var(--bg-elevated)',
                                       color: isMe ? 'white' : 'var(--text-primary)',
                                       border: isMe ? 'none' : '1px solid var(--border-subtle)',
                                       boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                   }}>
                                       {msg.text}
                                   </div>
                                   <div style={{
                                       fontSize: '0.75rem', opacity: 0.5, marginTop: 4, 
                                       textAlign: isMe ? 'right' : 'left'
                                   }}>
                                       {timeAgo(msg.createdAt)}
                                   </div>
                               </div>
                           );
                       })}
                       <div ref={scrollRef} />
                   </div>

                   {/* Input Area */}
                   <div style={{
                       padding: '20px', borderTop: '1px solid var(--border-subtle)', 
                       background: 'var(--bg-elevated)', display: 'flex', gap: 12
                   }}>
                       <input 
                           type="text" 
                           placeholder="Type a message..." 
                           value={replyText}
                           onChange={(e) => setReplyText(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                           style={{
                               flex: 1, padding: '14px 20px', borderRadius: '50px', 
                               border: '1px solid var(--border-subtle)', background: 'var(--bg-root)',
                               color: 'var(--text-primary)', outline: 'none', fontSize: '1rem'
                           }}
                       />
                       <button 
                           onClick={handleSend}
                           disabled={!replyText.trim()}
                           style={{
                               width: 50, height: 50, borderRadius: '50%', border: 'none',
                               background: replyText.trim() ? 'var(--primary-gradient)' : 'var(--bg-root)',
                               color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                               transition: 'all 0.2s', opacity: replyText.trim() ? 1 : 0.5
                           }}
                       >
                           ➤
                       </button>
                   </div>
               </>
           ) : (
               <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5}}>
                   <span style={{fontSize: '4rem', marginBottom: 20}}>💬</span>
                   <h3>Select a conversation</h3>
                   <p>Choose an instructor from the left to start chatting.</p>
               </div>
           )}
       </div>
    </div>
  );
}
