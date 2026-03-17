import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

let cache = "";
let last = 0;

async function getPatch() {
  if (cache && Date.now() - last < 3600000) return cache;

  const base = "https://www.leagueoflegends.com";

  const { data } = await axios.get(
    base + "/pt-br/news/game-updates/"
  );

  const $ = cheerio.load(data);

  let link = $("a[href*='/news/game-updates/']").first().attr("href");

  if (!link) throw new Error("Link do patch não encontrado");

  // 🔥 GARANTE URL CORRETA
  if (!link.startsWith("http")) {
    link = base + link;
  }

  const page = await axios.get(link);
  const $$ = cheerio.load(page.data);

  cache = $$("body").text().slice(0, 3000);
  last = Date.now();

  return cache;
}

app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;

    const allies = context.allies || "nenhum";
    const enemies = context.enemies || "nenhum";
    const bans = context.bans || "nenhum";

    const patch = await getPatch();

    const prompt = `
Você é um jogador Challenger especialista em League of Legends.

PATCH:
${patch}

Aliados: ${allies}
Inimigos: ${enemies}
Bans: ${bans}

Responda com:
- Campeão ideal
- Runas
- Build
- Estratégia

Pergunta:
${question}
`;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.content[0].text;

    res.json({ text });

  } catch (e) {
    console.log(e.response?.data || e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("rodando"));
