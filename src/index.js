require("dotenv/config");
const { Client, IntentsBitField } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const ms = require("ms");
const { commands, prefix } = require("npm");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
})
const config = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(config);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const noperms = new EmbedBuilder().setDescription(":unamused: I can't do that, because I don't have the permissions for it.")
const errorEmbed = new EmbedBuilder().setColor([232, 31, 16]).setDescription(":thinking: Ooops, something went wrong while trying to run that command!");

client.on("ready", async (c) => {
  console.log(`${c.user.tag} is online!`);
  await sleep(1000);
  console.log("INFO: Logging started.");
  await sleep(300);
  console.log("INFO: Standby. Waiting for events.");
  await sleep(300);
  console.log("INFO: Any events or errors will be logged here.");
  console.log("Status: Standby");
});




client.on('messageCreate', async (message) => {
  c = message.content
  if (c.startsWith("?delete")||c.startsWith("!delete")) {
    // Extract the number from the command argument
    let args = message.content.split(' ');
    let limit = parseInt(args[1]);
    // Check if the limit is a valid number
    if (isNaN(limit) || limit <= 0) {
      message.reply('Please provide a valid number greater than 0.');
      setTimeout(async () => {
        const messages = await message.channel.messages.fetch({ limit: 1 })
        messages.first().delete()
      }, 2000);
      return;
    }

    const channel = message.channel;
    try {
      const messages = await channel.messages.fetch({ limit: limit   });
      const lastMessage = messages.last()
      message.delete(lastMessage.id)
      await channel.bulkDelete(messages, true);
      message.channel.sendTyping()
      message.channel.send(`Successfully deleted ${messages.size} messages.`);
      setTimeout(async () => {
        const messages = await message.channel.messages.fetch({ limit: 1 })
        messages.first().delete()
      }, 2000);
    } catch (error) {
      console.error('Error deleting messages:', error);
      message.reply('An error occurred while deleting messages.');
      setTimeout(async () => {
        const messages = await message.channel.messages.fetch({ limit: 1 })
        messages.first().delete()
      }, 2000);
    }
  }
  else if (c=="?membercount"||c=="!membercount") {
    message.reply({embeds: [
      new EmbedBuilder({
        title: "Members",
        description: `**All:** ${message.guild.memberCount}\n\n**Bots:** 
        ${message.guild.members.cache.filter(member => member.user.bot).size}`})
        .setColor([2, 179, 43]
    )]});
  }
  else if (c.startsWith("?mute")||c.startsWith("!mute")) {
    let argv = c.split(" ")
    if (!argv[1]) return;
    message.reply(argv[1])
    muteuser = argv[1]
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    console.log(`INFO: COMMAND: ${interaction.commandName}`);
    if (interaction.commandName === "randomnum") {
      const min1 = interaction.options.get("min").value;
      const max2 = interaction.options.get("max").value;
      const min = Math.min(
        interaction.options.get("min").value,
        interaction.options.get("max").value
      );
      const max = Math.max(
        interaction.options.get("min").value,
        interaction.options.get("max").value
      );
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      interaction.reply(randomNum)
    } else if (interaction.commandName == "ask-gpt") {
      console.log("INFO: CMD Recieved");
      prompt = interaction.options.get("prompt").value;
      try {
        const result = await openai
        .createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          max_tokens: 256,
        })
        console.log("INFO: Trying to show response of openai to user.");
        interaction.reply(result.data.choices[0].text);  
      } catch (error) {
          console.log("Status: error");
          console.log(`ERROR (openai.createCompletion): ${error}`);
          interaction.reply({embeds: [errorEmbed], ephemeral: true});
          return;
      }
    }
    else if (interaction.commandName == "purge") {
      try {
        // interaction.deferReply()
        // interaction.reply("Done.")  
        // interaction.channel.messages.fetch({limit: 5}).then(msgs => msgs.)
        // interaction.channel.bulkDelete(5)
        async () => {
          interaction.channel.sendTyping()
          interaction.reply("doing")
          let fetched;
          do {
            fetched = await interaction.channel.messages.fetch({limit: 5});
            message.channel.bulkDelete(fetched);
            interaction.editReply(`Deleting... ${fetched.size}`)
          }
          while(fetched.size >= 2);
        }
      } catch (err) {
        interaction.reply({embeds: [noperms]})
      }
    }
  }
});

const gptCommand = new SlashCommandBuilder();
gptCommand.setName("ask-gpt");
gptCommand.setDescription("Send a prompt to GPT");
gptCommand.addStringOption((option) =>
  option
    .setName("prompt")
    .setDescription("Prompt to send to GPT.")
    .setRequired(true)
);

const randCommand = new SlashCommandBuilder();
randCommand.setName("randomnum");
randCommand.setDescription(
  "Generate a random number with range of your choice"
);
randCommand.addIntegerOption((optionMin) =>
  optionMin
    .setName("min")
    .setDescription("The minimum number it could be")
    .setRequired(true)
);
randCommand.addIntegerOption((optionMax) =>
  optionMax
    .setName("max")
    .setDescription("The maximum number it could be")
    .setRequired(true)
);

const muteCommand = new SlashCommandBuilder();
muteCommand
  .setName("mute")
  .setDescription("Mute a user for a specified duration")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to mute")
  );
muteCommand.addStringOption((theoption) =>
  theoption
    .setName("duration")
    .setDescription("How long to mute the user (e.g. 1m, 1h, 1y)")
);

const purgeCommand = new SlashCommandBuilder();
purgeCommand.setName("purge");
purgeCommand.setDescription("Send a prompt to GPT");
purgeCommand.addChannelOption((option) =>
  option
    .setName("channel")
    .setDescription("Prompt to send to GPT.")
    .setRequired(true)
);
main();

async function main() {
  const commands = [gptCommand, randCommand, muteCommand, purgeCommand];
  try {
    console.log("INFO: Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );
    client.login(process.env.TOKEN);
  } catch (err) {
    console.log(err);
  }
}
