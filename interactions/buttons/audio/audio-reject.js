const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "audio-reject",

	async execute(interaction) {
		const reviewAudioMessage = await interaction.message
		const requesterUserId = reviewAudioMessage.embeds[0].footer.text

		const audioRejectedEmbed = new EmbedBuilder()
		.setTitle(':white_check_mark: Audio Rejected')
		.setDescription(`Audio rejected by ${interaction.user}`)
		.setColor('#9dd12e')

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
			embeds: [audioRejectedEmbed],
			components: [row]
		})

		await interaction.reply({
			content: ':white_check_mark: Successfully rejected audio',
			ephemeral: true
		})

		// DM USER THEIR AUDIO WAS APPROVED \\
        const userDMChannel = await interaction.client.users.createDM(requesterUserId)
        try {
            await userDMChannel.send(`:x: Your recent audio upload request was rejected by ${interaction.user}.`)
        } catch(err) {
            await interaction.reply(`:warning: Couldn't DM the user about the audio results.`)
        }
	},
};
