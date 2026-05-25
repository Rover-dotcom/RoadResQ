/**
 * Admin Routes — RoadResQ v9.0.0 (Week 7)
 *
 * POST /api/admin/backup        — Run full Firestore backup
 * GET  /api/admin/backup/history — Get backup history
 * GET  /api/admin/backup/latest  — Get latest backup
 * GET  /api/admin/system-info    — System info
 */
const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { runFullBackup, getBackupHistory, getLatestBackup } = require('../utils/backupEngine');

const router = Router();

router.post('/backup', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await runFullBackup(req.user.uid);
    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/backup/history', verifyToken, requireRole('admin'), async (_req, res) => {
  try {
    const history = await getBackupHistory();
    res.json({ status: 'success', data: { history, count: history.length } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/backup/latest', verifyToken, requireRole('admin'), async (_req, res) => {
  try {
    const latest = await getLatestBackup();
    res.json({ status: 'success', data: latest || { message: 'No backups found' } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/system-info', verifyToken, requireRole('admin'), async (_req, res) => {
  res.json({
    status: 'success',
    data: {
      version: '9.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: `${(process.uptime() / 60).toFixed(1)} minutes`,
      memoryUsage: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      },
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
});

module.exports = router;
