/**
 * Notification Routes — RoadResQ v9.0.0 (Week 7)
 */
const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  registerToken, getNotifications, markReadHandler,
  markAllReadHandler, getUnreadCountHandler, sendNotificationHandler,
} = require('../controllers/notificationController');

const router = Router();

router.post('/token',      verifyToken, registerToken);
router.get('/',            verifyToken, getNotifications);
router.get('/unread-count', verifyToken, getUnreadCountHandler);
router.put('/read-all',    verifyToken, markAllReadHandler);
router.put('/:id/read',   verifyToken, markReadHandler);
router.post('/send',       verifyToken, requireRole('admin'), sendNotificationHandler);

module.exports = router;
