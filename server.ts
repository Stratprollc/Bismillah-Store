import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json());

  // API Routes
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { prompt, systemInstruction, tools, config, contents } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
      }

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({ 
        model: config?.model || "gemini-flash-latest",
        contents: contents || [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          tools: tools,
          ...(config?.generationConfig || {})
        }
      });

      res.json({ 
        text: response.text,
        functionCalls: response.functionCalls
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Keep old endpoint for compatibility if needed, or redirect it
  app.post('/api/gemini/voice-parse', async (req, res) => {
    // Redirect to the new generic one
    req.url = '/api/gemini/generate';
    app._router.handle(req, res, () => {});
  });

  const isProd = process.env.NODE_ENV === 'production';

  // For development (AI Studio / Local dev)
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } 
  // For production (Hostinger)
  else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Support SPA routing (redirect all non-file requests to index.html with existence guarantee)
    app.use((req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application is building or index.html is temporarily unavailable. Please refresh in a few seconds.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
