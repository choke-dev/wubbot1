const { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fileTypeChecker = require('file-type-checker');
const { audioReviewChannelId } = require("../../../bot_config.json")

async function notAudio(interaction) {
  const notAudioEmbed = new EmbedBuilder()
  .setTitle(':x: Error')
  .setDescription('File uploaded wasn\'t an audio file!')
  .setColor('#dd2e46')

  return await interaction.editReply({
      embeds: [notAudioEmbed],
      ephemeral: true
  });
}

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	// The data needed to register slash commands to Discord.

	data: new SlashCommandBuilder()
		.setName("uploadaudio")
		.setDescription("Sends a request to game moderators to allow an audio to be used in-game.")
    .addAttachmentOption(option =>
		  option
        .setName("audiofile")
			  .setDescription('The audio file to request to be uploaded in-game.')
			  .setRequired(true)
    ),

	async execute(interaction) {
    const attachmentData = interaction.options.getAttachment('audiofile');
    
    await interaction.deferReply();

    if (!attachmentData.contentType.includes("audio")) return notAudio(interaction)

    const attachmentFileResponse = await fetch(attachmentData.url);
    const attachmentFileBuffer = await attachmentFileResponse.arrayBuffer();

    if (attachmentFileBuffer.byteLength > 20971520) { // 20 MB in bytes
      const audioTooLargeEmbed = new EmbedBuilder()
      .setTitle(':x: Error')
      .setDescription('Audio file is too large (over 20MB)')
      .setColor('#dd2e46')

      return await interaction.reply({
        embeds: [audioTooLargeEmbed],
        ephemeral: true
      });
    }

    const isAudioFile = fileTypeChecker.validateFileType(attachmentFileBuffer, ["mp3", "ogg"]);

    if (!isAudioFile) return notAudio(interaction);

    const newAudioReviewEmbed = new EmbedBuilder()
    .setTitle('Review audio for upload')
    .setDescription(`Upload requested by ${interaction.user}`)
    .setColor('#f4600f')
    .setFooter({ text: interaction.user.id })

    const newAudioReviewButtonReject = new ButtonBuilder()
    .setCustomId('audio-reject')
    .setLabel('Reject Audio')
    .setStyle(ButtonStyle.Danger)
    const newAudioReviewButtonApprove = new ButtonBuilder()
    .setCustomId('audio-approve')
    .setLabel('Approve Audio')
    .setStyle(ButtonStyle.Success)
    const row = new ActionRowBuilder()
			.addComponents(newAudioReviewButtonReject, newAudioReviewButtonApprove);

    const audioReviewChannel = interaction.client.channels.cache.get(audioReviewChannelId)  //client.channels.cache.get(audioReviewChannelId);
    audioReviewChannel.send({
      embeds: [newAudioReviewEmbed],
      files: [attachmentData],
      components: [row]
    });

    const successfullyRequestedEmbed = new EmbedBuilder()
    .setTitle(':white_check_mark: Success')
    .setDescription('Sent audio file for review')
    .setColor('#23a55a')

    return await interaction.editReply({
      embeds: [successfullyRequestedEmbed],
    })
	},
};
