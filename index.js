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

  // FIRST TIME NOT JOINED
  if (!users.has(id)) {
    users.set(id, "new");

    return ctx.reply(
      "👋 Welcome!\n\nPlease join our channels:",
      Markup.inlineKeyboard([
        [Markup.button.url("🌍 Global Channel", "https://t.me/Global_Method_Channel")],
        [Markup.button.url("🆘 Support Owner", "https://t.me/Smart_Method_Owner")],
        [Markup.button.callback("✅ I Joined", "joined_check")]
      ])
    );
  }

  // AFTER JOIN (OR SECOND START)
  return ctx.reply(
`✅ Welcome!

🇧🇩 বাংলায়:
আপনি এখন বট ব্যবহার করতে পারবেন।
TikTok/Facebook/YouTube ভিডিও ডাউনলোড করতে ভিডিও লিংক পাঠান 📥

🇬🇧 English:
You can now use the bot. Send a TikTok/Facebook/YouTube link to download video 📥`
  );
});

/* ================= JOIN BUTTON ================= */
bot.action("joined_check", (ctx) => {
  users.set(ctx.from.id, "joined");

  return ctx.reply(
`✅ Welcome!

🇧🇩 বাংলায়:
আপনি এখন বট ব্যবহার করতে পারবেন।
TikTok/Facebook/YouTube ভিডিও ডাউনলোড করতে ভিডিও লিংক পাঠান 📥

🇬🇧 English:
You can now use the bot. Send a TikTok/Facebook/YouTube link to download video 📥`
  );
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

/* ================= YOUTUBE (STABLE FIX) ================= */
const ytdl = require("ytdl-core");

async function getYouTube(url) {
  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: "18" });

    return {
      video: format.url
    };
  } catch {
    return null;
  }
}

/* ================= MESSAGE HANDLER ================= */
bot.on("text", async (ctx) => {
  const id = ctx.from.id;
  const url = ctx.message.text;

  if (url.startsWith("/")) return;

  if (users.get(id) === "new") {
    return ctx.reply("⚠️ Please press 'I Joined' or continue without join.");
  }

  /* ================= FACEBOOK ================= */
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    ctx.reply("⏳ Downloading Facebook video...");

    const data = await getFacebook(url);

    if (!data?.video) {
      return ctx.reply("❌ Facebook video download failed!");
    }

    return ctx.replyWithVideo({ url: data.video }, {
      caption: "📥 Facebook Video Downloaded Successfully!"
    });
  }

  /* ================= YOUTUBE ================= */
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    ctx.reply("⏳ Downloading YouTube video...");

    const data = await getYouTube(url);

    if (!data?.video) {
      return ctx.reply("❌ YouTube video download failed!");
    }

    return ctx.replyWithVideo({ url: data.video }, {
      caption: "📥 YouTube Video Downloaded Successfully!"
    });
  }

  /* ================= TIKTOK ================= */
  if (!url.includes("tiktok.com")) {
    return ctx.reply("❌ Please send TikTok / Facebook / YouTube link!");
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
      caption:
        "📥 Download Completed Successfully!\n🎬 Video ready to save",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎧 Get MP3", callback_data: "get_mp3" }],
          [{ text: "🟢 Support ID", url: "https://t.me/Smart_Method_Owner" }]
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
bot.catch(console.log);

bot.launch();

console.log("🚀 Bot Running...");
