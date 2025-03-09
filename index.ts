import axios from "axios";
import * as fs from "fs";
import { AtpAgent, AtpSessionEvent, AtpSessionData } from "@atproto/api";
import "dotenv/config";

const tetrapi = "https://ch.tetr.io/api/news/global";

const agent = new AtpAgent({
  service: "https://bsky.social",
  persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
    if (sess) {
      fs.writeFileSync("session.json", JSON.stringify(sess));
    }
  },
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (fs.existsSync("session.json")) {
  const session = JSON.parse(fs.readFileSync("session.json", "utf-8"));
  await agent.resumeSession(session);
} else {
  await agent.login({
    identifier: process.env.BSKY_USERNAME || "",
    password: process.env.BSKY_PASSWORD || "",
  });
}
async function main(): Promise<void> {
  console.log("Checking for new news...");
  const response = await axios.get(tetrapi, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const data: any = response.data;
  const news: any[] = data.data.news;
  if (!fs.existsSync("cache.json")) {
    console.log(`No cache found, creating new cache...`)
    fs.writeFileSync("cache.json", JSON.stringify(news));
    setTimeout(main, 7200000);
    return;
  }
  const cache: any[] = JSON.parse(fs.readFileSync("cache.json", "utf-8"));
  const newNews: any[] = news.filter(
    (item) => !cache.some((cacheItem) => cacheItem.id === item.id)
  );
  console.log(`Found ${newNews.length} new news items.`);
  if (newNews.length > 0) {
    for (let i = 0; i < newNews.length; i++) {
      const current: any = newNews[i];
      if (current.type === "leaderboard") {
        await agent.post({
          text: `🏆 - ${current.data.username} made #${current.data.rank} place on ${current.data.gametype}!\n\n#tetrio #tetris\n#https://tetr.io/#R:${current.data.replayid}`,
        });
        console.log(`Posted leaderboard news for ${current.data.username}`);
      } else if (current.type === "badge") {
        await agent.post({
          text: `🎖️ - ${current.data.username} earned the ${current.data.label} badge!\n\n#tetrio #tetris`,
        });
        console.log(`Posted badge news for ${current.data.username}`);
      }
      await wait(60000);
    }
  }
  fs.writeFileSync("cache.json", JSON.stringify(news));
  console.log("Updated cache.");
  setTimeout(main, 7200000);
}

main().catch(console.error);
