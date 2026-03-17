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

Aliados: ${context.allies}
Inimigos: ${context.enemies}
Bans: ${context.bans}

Responda com:
- Campeão ideal
- Runas
- Build
- Estratégia

Pergunta:
${question}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    res.json({ text: data.choices[0].message.content });
  } catch (e) {
  console.log(e);
  res.status(500).json({ error: e.message });
}
});

app.listen(3000, () => console.log("rodando"));
