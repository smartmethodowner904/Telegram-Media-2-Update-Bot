const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const config = require("./config");

const bot = new Telegraf(config.BOT_TOKEN);

// memory
const users = new Map();
const userVideos = new Map();

/* ================= START ================= */
bot.start(async (ctx) => {
  const id = ctx.from.id;

  if (users.get(id) === "joined") {
    return ctx.reply(
`✅ Welcome!

🇧🇩 বাংলায়:
আপনি এখন বট ব্যবহার করতে পারবেন।
TikTok / Facebook ভিডিও লিংক পাঠান 📥

🇬🇧 English:
Send TikTok or Facebook link to download video 📥`
    );
  }

  return ctx.reply(
    "👋 Welcome!\n\nPlease join our channels to use the bot:",
    Markup.inlineKeyboard([
      [Markup.button.url("🌍 Global Channel", "https://t.me/Global_Method_Channel")],
      [Markup.button.url("🆘 Support Owner", "https://t.me/Smart_Method_Owner")],
      [Markup.button.callback("✅ I Joined", "joined_check")]
    ])
  );
});

/* ================= JOIN ================= */
bot.action("joined_check", (ctx) => {
  users.set(ctx.from.id, "joined");

  return ctx.reply(
`✅ Welcome!

🇧🇩 বাংলায়:
আপনি এখন বট ব্যবহার করতে পারবেন।
TikTok / Facebook ভিডিও লিংক পাঠান 📥

🇬🇧 English:
Send TikTok or Facebook link to download video 📥`
  );
});

/* ================= TIKTOK API ================= */
async function getTikTok(url) {
  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);

    if (res?.data?.data?.play) {
      return {
        video: res.data.data.play,
        audio: res.data.data.music
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/* ================= FACEBOOK API ================= */
async function getFacebook(url) {
  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);

    if (res?.data?.data?.play) {
      return {
        video: res.data.data.play
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/* ================= MESSAGE HANDLER ================= */
bot.on("text", async (ctx) => {
  const id = ctx.from.id;
  const url = ctx.message.text;

  if (url.startsWith("/")) return;

  if (users.get(id) !== "joined") {
    return ctx.reply("❌ Please join first!");
  }

  /* ================= FACEBOOK ================= */
  if (url.includes("facebook.com") || url.includes("fb.watch")) {

    ctx.reply("⏳ Downloading Facebook video...");

    const data = await getFacebook(url);

    if (!data?.video) {
      return ctx.reply("❌ Facebook video download failed!");
    }

    return ctx.replyWithVideo(
      { url: data.video },
      {
        caption: "📥 Facebook Video Downloaded Successfully!"
      }
    );
  }

  /* ================= TIKTOK ================= */
  if (!url.includes("tiktok.com")) {
    return ctx.reply("❌ Please send valid TikTok or Facebook link!");
  }

  ctx.reply("⏳ Downloading TikTok video...");

  const data = await getTikTok(url);

  if (!data?.video) {
    return ctx.reply("❌ Failed to download video!");
  }

  userVideos.set(id, data);

  return ctx.replyWithVideo(
    { url: data.video },
    {
      caption:
        "📥 Download Completed!\n🎬 Video ready to save\n\n🎧 Click button for MP3",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🟢 Support", url: "https://t.me/Smart_Method_Owner" }],
          [{ text: "🎧 Get MP3", callback_data: "get_mp3" }]
        ]
      }
    }
  );
});

/* ================= MP3 ================= */
bot.action("get_mp3", async (ctx) => {
  const data = userVideos.get(ctx.from.id);

  if (!data?.audio) {
    return ctx.reply("❌ No audio found!");
  }

  return ctx.replyWithAudio(
    { url: data.audio },
    {
      caption: "🎧 MP3 Downloaded Successfully!"
    }
  );
});

/* ================= ERROR ================= */
bot.catch((err) => console.log("Bot Error:", err));

bot.launch();

console.log("🚀 Bot is running...");
