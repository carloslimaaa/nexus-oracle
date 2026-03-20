import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

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

// ── GET / health check ──
app.get("/", (req, res) => {
  res.json({ status: "Nexus Oracle online", modelos: "Groq (texto) + OpenRouter (visão)" });
});

// ── POST /oracle — texto via Groq ──
app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error: "question ausente" });

    const allies  = context.allies  || "nenhum";
    const enemies = context.enemies || "nenhum";
    const bans    = context.bans    || "nenhum";
    const patch   = await getPatch();

    const prompt = `Você é um coach Challenger de League of Legends. Responda em português brasileiro de forma direta e objetiva.

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

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: "Você é um coach Challenger de League of Legends. Responda sempre em português brasileiro.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices[0].message.content;
    res.json({ text });

  } catch (e) {
    const detail = e.response?.data || e.message;
    console.log("ERRO /oracle:", JSON.stringify(detail));
    res.status(500).json({ error: JSON.stringify(detail) });
  }
});

// ── POST /analyze — visão via OpenRouter ──
app.post("/analyze", async (req, res) => {
  try {
    const { image, context = {} } = req.body;
    if (!image) return res.status(400).json({ error: "image ausente" });

    const allies  = context.allies  || "não informado";
    const enemies = context.enemies || "não informado";
    const bans    = context.bans    || "não informado";

    const prompt = `Você é um coach Challenger de League of Legends analisando um screenshot em tempo real.

Contexto: meu time: ${allies} | inimigos: ${enemies} | bans: ${bans}

Analise o screenshot e retorne APENAS JSON válido, sem nenhum texto fora do JSON:
{
  "acao": "o que fazer AGORA em até 8 palavras",
  "urgencia": "alta|media|baixa",
  "detalhes": "explicação em 1-2 frases",
  "observacoes": ["obs1", "obs2"]
}

Observe: vida/mana do jogador, posição no mapa, objetivos (dragão/barão/torretas), ameaças visíveis.
Se a imagem não mostrar claramente o jogo, retorne: {"acao":"Aguardando imagem clara","urgencia":"baixa","detalhes":"Imagem não identificada como League of Legends.","observacoes":[]}`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.2-11b-vision-instruct:free",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nexus-oracle.onrender.com",
          "X-Title": "Nexus Oracle",
        },
      }
    );

    const raw = response.data.choices[0].message.content;

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
    const detail = e.response?.data || e.message;
    console.log("ERRO /analyze:", JSON.stringify(detail));
    res.status(500).json({ error: JSON.stringify(detail) });
  }
});

app.listen(3000, () => console.log("Nexus Oracle rodando na porta 3000"));
