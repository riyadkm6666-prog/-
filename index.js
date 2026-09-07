const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const PREFIX = ".";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("Scan this QR code:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("RIRC RIYAD BOT ONLINE ✅");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("Connection closed.");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (command === "ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!\n🤖 RIRC RIYAD BOT is online."
      });
    }

    if (command === "info") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "╭───✦〔 💫 RIRC RIYAD BOT 〕✦───╮\n" +
          "┃ 🤖 Bot : RIRC Riyad Bot\n" +
          "┃ 💗 Prefix : .\n" +
          "┃ ⚡ Status : Online\n" +
          "╰────────────────────────╯"
      });
    }

    if (command === "owner") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👑 Owner : Riyad"
      });
    }

    if (command === "menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "╭───✦〔 💫 ʀɪʏᴀᴅ ᴄᴏᴍᴍᴀɴᴅꜱ 〕✦───╮\n" +
          "┃ 🤖 Bot : RIRC RIYAD BOT\n" +
          "┃ 💗 Prefix : .\n" +
          "┃\n" +
          "┃ ⚡ QUICK START\n" +
          "┃ • .ping\n" +
          "┃ • .info\n" +
          "┃ • .owner\n" +
          "┃ • .menu\n" +
          "┃\n" +
          "┃ 🛡️ GROUP / ADMIN\n" +
          "┃ • .tagall\n" +
          "┃ • .kick\n" +
          "┃ • .mute\n" +
          "┃ • .warn\n" +
          "┃ • .welcome\n" +
          "╰────────────────────────╯"
      });
    }
  });
}

startBot();
