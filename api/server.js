import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Different port from Vite dev server

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Save dbV2 endpoint
app.post('/api/save-dbv2', (req, res) => {
  try {
    const { designData } = req.body;
    
    if (!designData) {
      return res.status(400).json({ error: 'Missing designData' });
    }

    // Paths
    const publicDir = path.join(__dirname, '../public');
    const dbv2Path = path.join(publicDir, 'dbV2.json');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(publicDir, `dbV2_backup_${timestamp}.json`);

    // 1. Duplicar dbV2.json atual (backup)
    if (fs.existsSync(dbv2Path)) {
      fs.copyFileSync(dbv2Path, backupPath);
      console.log(`✅ Backup created: dbV2_backup_${timestamp}.json`);
    }

    // 2. Apagar dbV2.json original
    if (fs.existsSync(dbv2Path)) {
      fs.unlinkSync(dbv2Path);
      console.log(`🗑️ Original dbV2.json deleted`);
    }

    // 3. Salvar novo dbV2.json direto no public
    fs.writeFileSync(dbv2Path, designData, 'utf8');
    console.log(`💾 New dbV2.json saved to public/`);

    return res.json({
      success: true,
      message: 'dbV2.json saved successfully',
      backupFile: `dbV2_backup_${timestamp}.json`,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('❌ Save dbV2 error:', error);
    return res.status(500).json({ 
      error: 'Failed to save dbV2', 
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Provisory API server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Provisory API server running on http://localhost:${PORT}`);
  console.log(`📁 Serving public folder: ${path.join(__dirname, '../public')}`);
});
