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

🇧🇩 আপনি এখন ভিডিও ডাউনলোড করতে পারবেন।
TikTok / Facebook / YouTube link পাঠান 📥

🇬🇧 Send TikTok / Facebook / YouTube link`
    );
  }

  return ctx.reply(
    "👋 Welcome!\n\nPlease join our channels:",
    Markup.inlineKeyboard([
      [Markup.button.url("🌍 Channel", "https://t.me/Global_Method_Channel")],
      [Markup.button.url("🆘 Support", "https://t.me/Smart_Method_Owner")],
      [Markup.button.callback("✅ I Joined", "joined_check")]
    ])
  );
});

/* ================= JOIN ================= */
bot.action("joined_check", (ctx) => {
  users.set(ctx.from.id, "joined");

  return ctx.reply("✅ Now send TikTok / Facebook / YouTube link 📥");
});

/* ================= TIKTOK ================= */
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
  } catch {
    return null;
  }
}

/* ================= FACEBOOK ================= */
async function getFacebook(url) {
  try {
    const api = `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);

    if (res?.data?.download_url) {
      return { video: res.data.download_url };
    }

    // fallback
    const api2 = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const res2 = await axios.get(api2);

    if (res2?.data?.data?.play) {
      return { video: res2.data.data.play };
    }

    return null;
  } catch {
    return null;
  }
}

/* ================= YOUTUBE ================= */
async function getYouTube(url) {
  try {
    // working public API
    const api = `https://api.cobalt.tools/api/json`;

    const res = await axios.post(api, {
      url: url,
      vCodec: "h264",
      vQuality: "720"
    });

    if (res?.data?.url) {
      return { video: res.data.url };
    }

    return null;
  } catch (err) {
    console.log("YT error:", err.message);
    return null;
  }
}

/* ================= MESSAGE ================= */
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
      return ctx.reply("❌ Facebook download failed!");
    }

    return ctx.replyWithVideo({ url: data.video }, {
      caption: "📥 Facebook video downloaded!"
    });
  }

  /* ================= YOUTUBE ================= */
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    ctx.reply("⏳ Downloading YouTube video...");

    const data = await getYouTube(url);

    if (!data?.video) {
      return ctx.reply("❌ YouTube download failed!");
    }

    return ctx.replyWithVideo({ url: data.video }, {
      caption: "📥 YouTube video downloaded!"
    });
  }

  /* ================= TIKTOK ================= */
  if (!url.includes("tiktok.com")) {
    return ctx.reply("❌ Send TikTok / Facebook / YouTube link!");
  }

  ctx.reply("⏳ Downloading TikTok video...");

  const data = await getTikTok(url);

  if (!data?.video) {
    return ctx.reply("❌ TikTok download failed!");
  }

  userVideos.set(id, data);

  return ctx.replyWithVideo(
    { url: data.video },
    {
      caption: "📥 Download completed",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎧 MP3", callback_data: "get_mp3" }]
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

  return ctx.replyWithAudio({ url: data.audio });
});

/* ================= ERROR ================= */
bot.catch((err) => console.log(err));

bot.launch();

console.log("🚀 Bot Running...");
