const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database-sqlite');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Get user notifications
router.get('/', authenticateToken, (req, res) => {
  const { limit = 50, offset = 0, unread_only = false } = req.query;
  
  let query = `
    SELECT * FROM notifications 
    WHERE user_id = ?
  `;
  const params = [req.user.userId];

  if (unread_only === 'true') {
    query += ' AND is_read = FALSE';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, notifications) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }

    // Get unread count
    db.get('SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
           [req.user.userId], (err, countResult) => {
      if (err) {
        console.error('Error counting unread notifications:', err);
        return res.status(500).json({ message: 'Failed to count notifications' });
      }

      res.json({
        notifications,
        unread_count: countResult.unread_count,
        total_fetched: notifications.length
      });
    });
  });
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const notificationId = req.params.id;

  // Verify notification belongs to user
  db.get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', 
         [notificationId, req.user.userId], (err, notification) => {
    if (err) {
      console.error('Error fetching notification:', err);
      return res.status(500).json({ message: 'Failed to fetch notification' });
    }

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    db.run('UPDATE notifications SET is_read = TRUE WHERE id = ?', [notificationId], (err) => {
      if (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ message: 'Failed to mark notification as read' });
      }

      res.json({ message: 'Notification marked as read' });
    });
  });
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, (req, res) => {
  db.run('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
         [req.user.userId], (err) => {
    if (err) {
      console.error('Error marking all notifications as read:', err);
      return res.status(500).json({ message: 'Failed to mark notifications as read' });
    }

    res.json({ message: 'All notifications marked as read' });
  });
});

// Delete notification
router.delete('/:id', authenticateToken, (req, res) => {
  const notificationId = req.params.id;

  // Verify notification belongs to user
  db.get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', 
         [notificationId, req.user.userId], (err, notification) => {
    if (err) {
      console.error('Error fetching notification:', err);
      return res.status(500).json({ message: 'Failed to fetch notification' });
    }

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    db.run('DELETE FROM notifications WHERE id = ?', [notificationId], (err) => {
      if (err) {
        console.error('Error deleting notification:', err);
        return res.status(500).json({ message: 'Failed to delete notification' });
      }

      res.json({ message: 'Notification deleted successfully' });
    });
  });
});

// Create notification (internal use)
router.post('/', authenticateToken, (req, res) => {
  const { user_id, title, message, type, related_id } = req.body;

  if (!user_id || !title || !message || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [user_id, title, message, type, related_id], function(err) {
    if (err) {
      console.error('Error creating notification:', err);
      return res.status(500).json({ message: 'Failed to create notification' });
    }

    res.status(201).json({
      message: 'Notification created successfully',
      notification_id: this.lastID
    });
  });
});

module.exports = router;