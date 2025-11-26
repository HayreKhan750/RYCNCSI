export function timeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  let date;

  if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
  } else if (timestamp.toDate) {
      date = timestamp.toDate();
  } else {
      date = new Date(timestamp);
  }

  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  
  return "Just now";
}
