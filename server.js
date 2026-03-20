import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ── Gemini ──
const genAI      = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const textModel  = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ── Cache do patch ──
let patchCache = "";
let patchLast  = 0;

async function getPatch() {
  if (patchCache && Date.now() - patchLast < 3600000) return patchCache;
  try {
    const base = "https://www.leagueoflegends.com";
    const { data } = await axios.get(base + "/pt-br/news/game-updates/", {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(data);
    let link = $("a[href*='/news/game-updates/']").first().attr("href");
    if (!link) throw new Error("Link não encontrado");
    if (!link.startsWith("http")) link = base + link;
    const page = await axios.get(link, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $$ = cheerio.load(page.data);
    patchCache = $$("body").text().slice(0, 3000);
    patchLast  = Date.now();
  } catch (e) {
    console.log("Aviso: patch notes indisponível:", e.message);
    patchCache = "Patch notes indisponíveis. Use conhecimento atual do League of Legends 2026.";
    patchLast  = Date.now();
  }
  return patchCache;
}

// ── GET / ──
app.get("/", (req, res) => {
  res.json({ status: "Nexus Oracle online", modelo: "Gemini 1.5 Flash (gratuito)" });
});

// ── POST /oracle ──
app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error: "question ausente" });

    const allies  = context.allies  || "nenhum";
    const enemies = context.enemies || "nenhum";
    const bans    = context.bans    || "nenhum";
    const patch   = await getPatch();

    const prompt = `Você é um coach Challenger de League of Legends. Responda em português brasileiro de forma direta.

PATCH ATUAL:
${patch}

PARTIDA:
- Meu time: ${allies}
- Inimigos: ${enemies}
- Bans: ${bans}

Responda com:
- Campeão ideal
- Runas (primária + secundária)
- Build (top 4 itens em ordem)
- Estratégia

Pergunta: ${question}`;

    const result = await textModel.generateContent(prompt);
    const text   = result.response.text();
    res.json({ text });

  } catch (e) {
    console.log("ERRO /oracle:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /analyze ──
app.post("/analyze", async (req, res) => {
  try {
    const { image, context = {} } = req.body;
    if (!image) return res.status(400).json({ error: "image ausente" });

    const allies  = context.allies  || "não informado";
    const enemies = context.enemies || "não informado";
    const bans    = context.bans    || "não informado";

    const prompt = `Você é um coach Challenger de League of Legends analisando um screenshot em tempo real.

Contexto: meu time: ${allies} | inimigos: ${enemies} | bans: ${bans}

Analise o screenshot e retorne APENAS JSON válido, sem nenhum texto fora:
{
  "acao": "o que fazer AGORA em até 8 palavras",
  "urgencia": "alta|media|baixa",
  "detalhes": "explicação em 1-2 frases",
  "observacoes": ["obs1", "obs2"]
}

Observe: vida/mana, posição, objetivos (dragão/barão/torretas), ameaças.
Se a imagem não mostrar claramente o jogo: {"acao":"Aguardando imagem clara","urgencia":"baixa","detalhes":"Não foi possível identificar o jogo.","observacoes":[]}`;

    const result = await visionModel.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } },
    ]);

    const raw = result.response.text();

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      parsed = {
        acao: "Processando...",
        urgencia: "baixa",
        detalhes: raw.slice(0, 150),
        observacoes: [],
      };
    }

    res.json(parsed);

  } catch (e) {
    console.log("ERRO /analyze:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("Nexus Oracle rodando na porta 3000"));
