import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

let cache = "";
let last = 0;

async function getPatch() {
  if (cache && Date.now() - last < 3600000) return cache;

  const { data } = await axios.get(
    "https://www.leagueoflegends.com/pt-br/news/game-updates/"
  );

  const $ = cheerio.load(data);
  const link = $("a").first().attr("href");

  const page = await axios.get("https://www.leagueoflegends.com" + link);
  const $$ = cheerio.load(page.data);

  cache = $$("body").text().slice(0, 3000);
  last = Date.now();

  return cache;
}

app.post("/oracle", async (req, res) => {
  try {
    const { question, context } = req.body;

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
    res.status(500).json({ error: "erro" });
  }
});

app.listen(3000, () => console.log("rodando"));
