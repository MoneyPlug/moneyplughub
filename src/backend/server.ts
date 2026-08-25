import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { db, initDb } from './db';
import authRoutes from './routes/auth';
import referralRoutes from './routes/referrals';
import adminRoutes from './routes/admin';
import financeRoutes from './routes/finance';
import gamificationRoutes from './routes/gamification';
import cryptoRoutes from './routes/crypto';
import routingRoutes from './routes/routing';
import programRoutes from './routes/programs';
import cashbackRoutes from './routes/cashback';
import referralHubRoutes from './routes/referralHub';
import balanceAgentRoutes from './routes/balanceAgent';
import earningsAgentRoutes from './routes/earningsAgent';
import referralAgentRoutes from './routes/referralAgent';
import automationAgentRoutes from './routes/automationAgent';
import insightAgentRoutes from './routes/insightAgent';
import orchestratorRoutes from './routes/orchestrator';
import affiliateRoutes from './routes/affiliate';
import commandCenterRoutes from './routes/commandCenter';
import generateRoutes from './routes/generate';
import aiOrchestratorRoutes from './routes/aiOrchestrator';
import moneyosRoutes from './routes/moneyos';
import ttsRoutes from './routes/tts';
import billingRoutes from './routes/billing';
import sigilRoutes from './routes/sigil';
import growthRoutes from './routes/growth';
import viralRoutes from './routes/viral';
import supportRoutes from './routes/support';
import paywallRoutes from './routes/paywall';
import adaptiveProfileRoutes from './routes/adaptiveProfile';
import voiceRoutes from './voice/router';
import lootRoutes from './routes/loot';
import syndicatesRoutes from './routes/syndicates';
import achievementsRoutes from './routes/achievements';
import { primordiaRouter, initPrimordiaSchema } from './routes/primordia';
import { xpEconomyRouter } from './routes/xpEconomy';

const app = express();

// Initialize database
initDb();
initPrimordiaSchema();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      origin.includes('moneyplughub.com') ||
      origin.includes('primordialorigin.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for universal API & embed accessibility
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Top-Level Public Single-Click Redirect Engine (/go/:slug)
app.use('/go', routingRoutes);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/cashback-pack', cashbackRoutes);
app.use('/api/referral-hub', referralHubRoutes);
app.use('/api/agents/balance', balanceAgentRoutes);
app.use('/api/agents/earnings', earningsAgentRoutes);
app.use('/api/agents/referral', referralAgentRoutes);
app.use('/api/agents/automation', automationAgentRoutes);
app.use('/api/agents/insight', insightAgentRoutes);
app.use('/api/orchestrator', orchestratorRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/command-center', commandCenterRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/v5', aiOrchestratorRoutes);
app.use('/api/moneyos', moneyosRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sigil', sigilRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/viral', viralRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/paywall', paywallRoutes);
app.use('/api/profile', adaptiveProfileRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/loot', lootRoutes);
app.use('/api/syndicates', syndicatesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/primordia', primordiaRouter);
app.use('/api/xp-economy', xpEconomyRouter);

// Healthcheck & Config Info Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'Plug In OS v5.0 — Sellable AI Orchestrator SaaS Engine Active',
    commission_rate_usd: config.commissionAmountUsd,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Dedicated Video Byte-Range Streaming for iOS Safari / WebKit compatibility
app.get('/boot.mp4', (req: Request, res: Response) => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'public/boot.mp4'),
    path.resolve(process.cwd(), 'dist/client/boot.mp4'),
    path.resolve(__dirname, '../../public/boot.mp4'),
    path.resolve(__dirname, '../../../public/boot.mp4'),
  ];
  const videoPath = possiblePaths.find(p => fs.existsSync(p));

  if (!videoPath) {
    res.status(404).send('Boot video not found');
    return;
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Production SPA Static File Serving
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist/client'),
  path.resolve(__dirname, '../../client'),
  path.resolve(__dirname, '../../../dist/client'),
];

const clientDistPath = possibleDistPaths.find(p => fs.existsSync(p)) || possibleDistPaths[0];
const clientDistExists = fs.existsSync(clientDistPath);

if (clientDistExists) {
  app.use(express.static(clientDistPath));
  
  // SPA Catch-all route
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/go')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Plug In OS v5.0 AI Orchestrator</title></head>
        <body style="background:#0a0d14;color:#00ff88;font-family:sans-serif;padding:40px;">
          <h1>Plug In OS v5.0 AI Orchestrator Online</h1>
          <p>Database: <code>${config.dbPath}</code></p>
          <p>Commission Rate: <strong>$${config.commissionAmountUsd.toFixed(2)}</strong> per qualified referral</p>
        </body>
      </html>
    `);
  });
}

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: config.isProd ? 'Internal Server Error' : err.message,
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`
⚡ Plug In OS v5.0 — Sellable AI Orchestrator SaaS Online
   - URL: http://localhost:${config.port}
   - AI Orchestrator API: http://localhost:${config.port}/api/v5/
   - Database: ${config.dbPath} (WAL Mode Active)
   - Commission: $${config.commissionAmountUsd.toFixed(2)} USD per referral
  `);
});

// Graceful Shutdown
const handleShutdown = () => {
  console.log('\nClosing server and database connections gracefully...');
  server.close(() => {
    db.close();
    console.log('MoneyPlugHub cleanly terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default app;
