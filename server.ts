import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Init Gemini client using process.env.GEMINI_API_KEY
// We must set the User-Agent header to 'aistudio-build' in httpOptions for telemetry.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes FIRST
app.post("/api/gemini/optimize-layout", async (req, res) => {
  try {
    const { columns, sampleData } = req.body;
    
    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: "Missing or invalid columns data" });
    }

    const systemPrompt = `You are an expert data analyst and UI/UX dashboard architect.
Analyze the provided columns and sample data of a spreadsheet. Recommend a highly optimized, cohesive, and beautiful dashboard card layout combination.
You can create cards of three types:
1. 'metric': to display aggregated key metrics. Config fields:
   - column: string (must be one of the numeric column names, or count can be any)
   - operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'MEDIAN'
   - prefix?: string (concise currency/unit symbol or prefix, e.g., '$' or '¥', only if applicable, else empty)
   - suffix?: string (concise unit or suffix, e.g., '元', '人', '次', '件', or '%', only if applicable, else empty)
2. 'chart': to display visual distributions or trends. Config fields:
   - type: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
   - xAxisColumn: string (typically categorical or date column)
   - yAxisColumn: string (numeric column)
   - aggregate: 'SUM' | 'AVG' | 'RAW'
3. 'table': to show a subset of raw detailed records. Config fields:
   - columns: string[] (names of columns to show)
   - pageSize: number (usually 5 to 10)

For each card, specify:
- id: a unique string identifier (e.g. 'auto-metric-sales', 'auto-chart-region')
- title: a concise, informative title in Traditional Chinese (繁體中文)
- type: 'metric' | 'chart' | 'table'
- width: '1/3' | '1/2' | '2/3' | 'full' (choose balanced widths, e.g., metrics can be 1/3, charts can be 1/2 or 2/3, table is full)
- metric, chart, or table object depending on its type.

Aim for a cohesive design:
- 3 metric cards at the top (width '1/3').
- 2 chart cards next (width '1/2').
- 1 detailed 'table' card at the bottom (width 'full').

Return a JSON array of these CardConfig objects matching the target TypeScript interface.`;

    const userPrompt = `Here are the columns: ${JSON.stringify(columns)}
And here is a sample of the raw data records (first few rows): ${JSON.stringify(sampleData)}

Provide your recommended layout in the exact schema specified. Keep the language of all titles in Traditional Chinese (繁體中文). Do not explain anything, just output the JSON array inside a standard JSON response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [userPrompt],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING, description: "Card title in Traditional Chinese" },
              type: { type: Type.STRING, enum: ["metric", "chart", "table"] },
              width: { type: Type.STRING, enum: ["1/3", "1/2", "2/3", "full"] },
              metric: {
                type: Type.OBJECT,
                properties: {
                  column: { type: Type.STRING },
                  operation: { type: Type.STRING, enum: ["SUM", "AVG", "COUNT", "MIN", "MAX", "MEDIAN"] },
                  prefix: { type: Type.STRING },
                  suffix: { type: Type.STRING }
                },
                required: ["column", "operation"]
              },
              chart: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["bar", "line", "pie", "area", "scatter"] },
                  xAxisColumn: { type: Type.STRING },
                  yAxisColumn: { type: Type.STRING },
                  aggregate: { type: Type.STRING, enum: ["SUM", "AVG", "RAW"] }
                },
                required: ["type", "xAxisColumn", "yAxisColumn", "aggregate"]
              },
              table: {
                type: Type.OBJECT,
                properties: {
                  columns: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  pageSize: { type: Type.INTEGER }
                },
                required: ["columns", "pageSize"]
              }
            },
            required: ["id", "title", "type", "width"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const cards = JSON.parse(text);
    return res.json({ cards });
  } catch (error: any) {
    console.error("Optimize Layout error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze layout" });
  }
});

// Vite middleware for development and server listen wrapped in async start function
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
});
