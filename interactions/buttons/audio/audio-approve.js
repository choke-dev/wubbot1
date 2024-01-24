const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "audio-approve",

	async execute(interaction) {
        const reviewAudioMessage = await interaction.message
        const requesterUserId = reviewAudioMessage.embeds[0].footer.text
        
		const audioApprovedEmbed = new EmbedBuilder()
		.setTitle(':white_check_mark: Audio Approved')
		.setDescription(`Audio approved by ${interaction.user}`)
		.setColor('#23a55a')

		const newAudioReviewButtonReject = new ButtonBuilder()
    	.setCustomId('audio-reject')
    	.setLabel('Reject Audio')
    	.setStyle(ButtonStyle.Danger)
		.setDisabled(true)
    	const newAudioReviewButtonApprove = new ButtonBuilder()
    	.setCustomId('audio-approve')
    	.setLabel('Approve Audio')
    	.setStyle(ButtonStyle.Success)
		.setDisabled(true)
    	const row = new ActionRowBuilder()
			.addComponents(newAudioReviewButtonReject, newAudioReviewButtonApprove);

		reviewAudioMessage.edit({
			embeds: [audioApprovedEmbed],
			components: [row]
		})

		await interaction.reply({
			content: ':white_check_mark: Successfully approved audio',
			ephemeral: true
		})

        // DM USER THEIR AUDIO WAS APPROVED \\
        const userDMChannel = await interaction.client.users.createDM(requesterUserId)
        try {
            await userDMChannel.send(`:white_check_mark: Your recent audio upload request was approved by ${interaction.user}.\n\nThe Audio ID will be sent to you shortly.`)
        } catch(err) {
            await interaction.reply(`:warning: Couldn't DM the user about the audio results.`)
        }

        /// AUDIO UPLOADING PART \\\
	},
};
