require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

const distube = new DisTube(client, {
  plugins: [new YouTubePlugin()]
});

// ================= PREFIX COMMANDS =================
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // 🎵 Play Music
  if (cmd === "play") {
    if (!message.member.voice.channel) return message.reply("Join a voice channel!");
    let song = args.join(" ");
    distube.play(message.member.voice.channel, song, {
      textChannel: message.channel,
      member: message.member
    });
  }

  // 🔒 Kick
  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    let user = message.mentions.members.first();
    if (user) user.kick();
    message.reply("User kicked.");
  }

  // 👑 God Mode (Owner only)
  if (cmd === "god") {
    if (message.author.id !== process.env.OWNER_ID) return;
    message.reply("👑 God Mode Activated!");
  }
});

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot ping"),
  new SlashCommandBuilder().setName("play").setDescription("Play music")
    .addStringOption(option =>
      option.setName("song").setDescription("Song name or URL").setRequired(true)
    )
].map(cmd => cmd.toJSON());

// Register slash commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("Slash commands registered");
  } catch (err) {
    console.error(err);
  }
})();

// Slash command handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("🏓 Pong!");
  }

  if (interaction.commandName === "play") {
    let song = interaction.options.getString("song");
    if (!interaction.member.voice.channel) return interaction.reply("Join VC first!");
    distube.play(interaction.member.voice.channel, song, {
      textChannel: interaction.channel,
      member: interaction.member
    });
    interaction.reply(`Playing: ${song}`);
  }
});

// ================= EVENTS =================
distube.on("playSong", (queue, song) => {
  queue.textChannel.send(`🎶 Playing: ${song.name}`);
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
