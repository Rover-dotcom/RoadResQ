/**
 * Admin Report Generator — RoadResQ v9.1.0 (Week 8)
 *
 * Generates a full system report with live data from Firestore.
 * Returns HTML that can be viewed in-browser or downloaded as PDF.
 *
 * GET /api/admin/report           — View report in browser
 * GET /api/admin/report?download=true — Download as HTML file
 */

const { db } = require('../config/firebase');

// ─── Collect Live Stats ──────────────────────────────────────────────────────

async function collectStats() {
  const stats = {};

  // Users
  const usersSnap = await db.collection('users').get();
  stats.totalUsers = usersSnap.size;
  const roles = { customer: 0, driver: 0, garage: 0, admin: 0 };
  usersSnap.docs.forEach(d => { const r = d.data().role || 'customer'; if (roles[r] !== undefined) roles[r]++; });
  stats.usersByRole = roles;

  // Drivers
  const driversSnap = await db.collection('drivers').get();
  stats.totalDrivers = driversSnap.size;
  stats.onlineDrivers = driversSnap.docs.filter(d => d.data().isOnline).length;

  // Jobs
  const jobsSnap = await db.collection('jobs').get();
  stats.totalJobs = jobsSnap.size;
  const jobStatuses = {};
  let totalRevenue = 0;
  jobsSnap.docs.forEach(d => {
    const data = d.data();
    const s = data.status || 'unknown';
    jobStatuses[s] = (jobStatuses[s] || 0) + 1;
    if (s === 'completed' && data.totalFare) totalRevenue += data.totalFare;
  });
  stats.jobsByStatus = jobStatuses;
  stats.totalRevenue = totalRevenue;
  stats.totalRevenueDisplay = `QR ${(totalRevenue / 100).toFixed(2)}`;

  // Disputes
  const disputesSnap = await db.collection('disputes').get();
  stats.totalDisputes = disputesSnap.size;
  const disputeStatuses = {};
  disputesSnap.docs.forEach(d => {
    const s = d.data().status || 'pending';
    disputeStatuses[s] = (disputeStatuses[s] || 0) + 1;
  });
  stats.disputesByStatus = disputeStatuses;

  // Wallets
  const walletsSnap = await db.collection('wallets').get();
  stats.totalWallets = walletsSnap.size;
  let totalWalletBalance = 0;
  walletsSnap.docs.forEach(d => { totalWalletBalance += (d.data().balance || 0); });
  stats.totalWalletBalance = totalWalletBalance;
  stats.totalWalletBalanceDisplay = `QR ${(totalWalletBalance / 100).toFixed(2)}`;

  // Payouts
  const payoutsSnap = await db.collection('payouts').get();
  stats.totalPayouts = payoutsSnap.size;
  const payoutStatuses = {};
  payoutsSnap.docs.forEach(d => {
    const s = d.data().status || 'pending';
    payoutStatuses[s] = (payoutStatuses[s] || 0) + 1;
  });
  stats.payoutsByStatus = payoutStatuses;

  // Fraud flags
  const fraudSnap = await db.collection('fraud_flags').get();
  stats.totalFraudFlags = fraudSnap.size;

  // Garage requests
  const garageSnap = await db.collection('garage_requests').get();
  stats.totalGarageRequests = garageSnap.size;

  // Saved vehicles
  const vehiclesSnap = await db.collection('saved_vehicles').get();
  stats.totalSavedVehicles = vehiclesSnap.size;

  // Notifications
  const notifsSnap = await db.collection('notifications').get();
  stats.totalNotifications = notifsSnap.size;

  // Safety feedback
  const safetySnap = await db.collection('safety_feedback').get();
  stats.totalSafetyReports = safetySnap.size;

  // Incidents
  const incidentsSnap = await db.collection('incidents').get();
  stats.totalIncidents = incidentsSnap.size;

  return stats;
}

// ─── System Info ─────────────────────────────────────────────────────────────

function getSystemInfo() {
  return {
    version: '9.1.0',
    environment: process.env.NODE_ENV || 'development',
    project: 'roadresq-bd6b0',
    region: 'me-central1 (Doha, Qatar)',
    googleMaps: process.env.GOOGLE_MAPS_API_KEY ? 'Active (Production Key)' : 'Fallback (Haversine)',
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()) + 's',
    controllers: 22,
    routes: 23,
    engines: 22,
    firestoreIndexes: 29,
    dependencies: ['express', 'firebase-admin', 'helmet', 'compression', 'express-rate-limit', 'winston', 'dotenv', 'cors', 'uuid', 'express-validator'],
    endpoints: {
      auth: '/api/auth', jobs: '/api/jobs', drivers: '/api/drivers',
      quotes: '/api/quotes', garageRequests: '/api/garage-requests',
      discipline: '/api/discipline', dashboard: '/api/dashboard',
      completion: '/api/completion', tracking: '/api/tracking',
      wallet: '/api/wallet', payouts: '/api/payouts',
      dispatch: '/api/dispatch', maps: '/api/maps',
      notifications: '/api/notifications', savedLocations: '/api/saved-locations',
      safety: '/api/safety', fraud: '/api/fraud', disputes: '/api/disputes',
      incidents: '/api/incidents', vehicles: '/api/vehicles',
      history: '/api/history', admin: '/api/admin',
    },
  };
}

// ─── Generate HTML Report ────────────────────────────────────────────────────

function generateReportHTML(stats, system) {
  const now = new Date().toLocaleString('en-QA', { timeZone: 'Asia/Qatar', dateStyle: 'full', timeStyle: 'medium' });
  const statusRows = Object.entries(stats.jobsByStatus || {}).map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');
  const disputeRows = Object.entries(stats.disputesByStatus || {}).map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');
  const payoutRows = Object.entries(stats.payoutsByStatus || {}).map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');
  const endpointRows = Object.entries(system.endpoints).map(([k, v]) =>
    `<tr><td>${k}</td><td><code>${v}</code></td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RoadResQ — Admin System Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background: #f4f6f9; color: #1a1a2e; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }

  /* Header */
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; padding: 40px 32px; border-radius: 12px; margin-bottom: 28px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 14px; opacity: 0.75; }
  .header .meta { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; }
  .header .meta span { background: rgba(255,255,255,0.12); padding: 4px 12px; border-radius: 6px; }

  /* Cards */
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; margin-bottom: 28px; }
  .card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .card .value { font-size: 26px; font-weight: 700; color: #0f172a; }
  .card .sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .card.green .value { color: #059669; }
  .card.blue .value { color: #2563eb; }
  .card.amber .value { color: #d97706; }
  .card.red .value { color: #dc2626; }

  /* Sections */
  .section { background: #fff; border-radius: 10px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
  th { background: #f8fafc; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
  tr:last-child td { border-bottom: none; }
  code { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 13px; color: #1e40af; }

  /* Status badges */
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge.active { background: #d1fae5; color: #065f46; }
  .badge.warn { background: #fef3c7; color: #92400e; }

  /* Footer */
  .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }

  /* Print */
  @media print {
    body { background: #fff; }
    .container { padding: 0; }
    .no-print { display: none !important; }
    .header { break-after: avoid; }
    .section { break-inside: avoid; }
  }

  .download-bar { text-align: right; margin-bottom: 16px; }
  .download-bar button { background: #0f172a; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600; }
  .download-bar button:hover { background: #1e3a5f; }
</style>
</head>
<body>
<div class="container">

  <div class="download-bar no-print">
    <button onclick="window.print()">⬇ Download / Print Report</button>
  </div>

  <div class="header">
    <h1>RoadResQ — System Report</h1>
    <div class="subtitle">Admin Overview — Backend API v${system.version}</div>
    <div class="meta">
      <span>📅 ${now}</span>
      <span>🌍 ${system.region}</span>
      <span>🔧 ${system.environment}</span>
      <span>🗺️ Google Maps: ${system.googleMaps}</span>
    </div>
  </div>

  <!-- Overview Cards -->
  <div class="cards">
    <div class="card">
      <div class="label">Total Users</div>
      <div class="value">${stats.totalUsers}</div>
      <div class="sub">👤 ${stats.usersByRole.customer} cust · ${stats.usersByRole.driver} drv · ${stats.usersByRole.garage} grg · ${stats.usersByRole.admin} adm</div>
    </div>
    <div class="card blue">
      <div class="label">Total Jobs</div>
      <div class="value">${stats.totalJobs}</div>
      <div class="sub">${stats.jobsByStatus.completed || 0} completed</div>
    </div>
    <div class="card green">
      <div class="label">Total Revenue</div>
      <div class="value">${stats.totalRevenueDisplay}</div>
      <div class="sub">From completed jobs</div>
    </div>
    <div class="card">
      <div class="label">Drivers</div>
      <div class="value">${stats.totalDrivers}</div>
      <div class="sub">${stats.onlineDrivers} online now</div>
    </div>
    <div class="card amber">
      <div class="label">Disputes</div>
      <div class="value">${stats.totalDisputes}</div>
      <div class="sub">${stats.disputesByStatus.pending || 0} pending</div>
    </div>
    <div class="card">
      <div class="label">Wallet Balance</div>
      <div class="value">${stats.totalWalletBalanceDisplay}</div>
      <div class="sub">${stats.totalWallets} wallets</div>
    </div>
    <div class="card red">
      <div class="label">Fraud Flags</div>
      <div class="value">${stats.totalFraudFlags}</div>
      <div class="sub">Flagged activities</div>
    </div>
    <div class="card">
      <div class="label">Garage Requests</div>
      <div class="value">${stats.totalGarageRequests}</div>
    </div>
    <div class="card">
      <div class="label">Saved Vehicles</div>
      <div class="value">${stats.totalSavedVehicles}</div>
    </div>
    <div class="card">
      <div class="label">Notifications</div>
      <div class="value">${stats.totalNotifications}</div>
    </div>
    <div class="card">
      <div class="label">Safety Reports</div>
      <div class="value">${stats.totalSafetyReports}</div>
    </div>
    <div class="card">
      <div class="label">Incidents</div>
      <div class="value">${stats.totalIncidents}</div>
    </div>
  </div>

  <!-- Jobs Breakdown -->
  <div class="section">
    <h2>Jobs by Status</h2>
    <table>
      <thead><tr><th>Status</th><th>Count</th></tr></thead>
      <tbody>${statusRows || '<tr><td colspan="2">No jobs yet</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Disputes Breakdown -->
  <div class="section">
    <h2>Disputes by Status</h2>
    <table>
      <thead><tr><th>Status</th><th>Count</th></tr></thead>
      <tbody>${disputeRows || '<tr><td colspan="2">No disputes</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Payouts Breakdown -->
  <div class="section">
    <h2>Payouts</h2>
    <table>
      <thead><tr><th>Status</th><th>Count</th></tr></thead>
      <tbody>${payoutRows || '<tr><td colspan="2">No payouts</td></tr>'}</tbody>
    </table>
  </div>

  <!-- System Info -->
  <div class="section">
    <h2>System Information</h2>
    <table>
      <tbody>
        <tr><td>API Version</td><td><code>v${system.version}</code></td></tr>
        <tr><td>Environment</td><td><span class="badge ${system.environment === 'production' ? 'active' : 'warn'}">${system.environment}</span></td></tr>
        <tr><td>Firebase Project</td><td><code>${system.project}</code></td></tr>
        <tr><td>Region</td><td>${system.region}</td></tr>
        <tr><td>Google Maps</td><td><span class="badge active">${system.googleMaps}</span></td></tr>
        <tr><td>Node.js</td><td>${system.nodeVersion}</td></tr>
        <tr><td>Server Uptime</td><td>${system.uptime}</td></tr>
        <tr><td>Controllers</td><td>${system.controllers}</td></tr>
        <tr><td>Route Modules</td><td>${system.routes}</td></tr>
        <tr><td>Utility Engines</td><td>${system.engines}</td></tr>
        <tr><td>Firestore Indexes</td><td>${system.firestoreIndexes}</td></tr>
        <tr><td>Dependencies</td><td>${system.dependencies.map(d => '<code>' + d + '</code>').join(' ')}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- API Endpoints -->
  <div class="section">
    <h2>API Endpoints (${Object.keys(system.endpoints).length} Modules)</h2>
    <table>
      <thead><tr><th>Module</th><th>Path</th></tr></thead>
      <tbody>${endpointRows}</tbody>
    </table>
  </div>

  <!-- Firestore Collections -->
  <div class="section">
    <h2>Firestore Collections</h2>
    <table>
      <thead><tr><th>Collection</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr><td><code>users</code></td><td>User accounts (customer, driver, garage, admin)</td></tr>
        <tr><td><code>drivers</code></td><td>Driver profiles, online status, GPS</td></tr>
        <tr><td><code>jobs</code></td><td>Service requests (tow, flat tire, fuel, etc.)</td></tr>
        <tr><td><code>quotes</code></td><td>Price quotes and bidding</td></tr>
        <tr><td><code>payments</code></td><td>Payment transactions</td></tr>
        <tr><td><code>wallets</code></td><td>User wallet balances</td></tr>
        <tr><td><code>wallet_transactions</code></td><td>Wallet deposit/withdraw ledger</td></tr>
        <tr><td><code>payouts</code></td><td>Driver payout requests</td></tr>
        <tr><td><code>disputes</code></td><td>ADR dispute cases</td></tr>
        <tr><td><code>fraud_flags</code></td><td>Fraud detection flags</td></tr>
        <tr><td><code>garage_requests</code></td><td>Garage/workshop repair requests</td></tr>
        <tr><td><code>incidents</code></td><td>Safety incidents and alerts</td></tr>
        <tr><td><code>safety_feedback</code></td><td>Safety ratings and feedback</td></tr>
        <tr><td><code>notifications</code></td><td>Push + in-app notifications</td></tr>
        <tr><td><code>saved_vehicles</code></td><td>Customer saved cars</td></tr>
        <tr><td><code>saved_locations</code></td><td>Customer saved addresses</td></tr>
        <tr><td><code>audit_logs</code></td><td>System audit trail</td></tr>
        <tr><td><code>backup_logs</code></td><td>Backup execution history</td></tr>
        <tr><td><code>idempotency_keys</code></td><td>Payment deduplication (24h TTL)</td></tr>
        <tr><td><code>pending_deletions</code></td><td>Data retention + GDPR cleanup</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    RoadResQ Admin Report · Generated ${now} · v${system.version}
  </div>

</div>
</body>
</html>`;
}

// ─── Express Handler ─────────────────────────────────────────────────────────

const generateReport = async (req, res) => {
  try {
    const stats = await collectStats();
    const system = getSystemInfo();
    const html = generateReportHTML(stats, system);

    if (req.query.download === 'true') {
      const filename = `RoadResQ_Report_${new Date().toISOString().slice(0, 10)}.html`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    console.error('[Report] Generation failed:', err);
    return res.status(500).json({ status: 'error', message: 'Report generation failed: ' + err.message });
  }
};

// ─── JSON report (for mobile app) ────────────────────────────────────────────

const generateReportJSON = async (_req, res) => {
  try {
    const stats = await collectStats();
    const system = getSystemInfo();
    return res.json({
      status: 'success',
      data: {
        generatedAt: new Date().toISOString(),
        stats,
        system,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { generateReport, generateReportJSON, collectStats, getSystemInfo };
