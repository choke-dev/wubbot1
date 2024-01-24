const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

async function getPlayerData(user) {
    if (Number(user)) {
        try {
            const response = await fetch(`https://users.roblox.com/v1/users/${Number(user)}`)
            return response.json()
        } catch (error) {
            console.error('Error fetching user name:', error);
            return null;
        }
    }

    try {
        const response = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usernames: [user],
                excludeBannedUsers: true
            })
        });
  
        const data = await response.json();
  
        // Check if there is data and if it contains the "name" field
        if (data && data.data && data.data.length > 0 && data.data[0].name) {
            return data.data[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching user name:', error);
        return null;
    }
}

async function getWubbyPlayerData(userid) {
    const response = await fetch(`https://api.wubbygame.com/users/${userid}`)
    return response
}

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	// The data needed to register slash commands to Discord.

	data: new SlashCommandBuilder()
		.setName("globalunban")
		.setDescription("Unbans a player from wubby.")
        .addStringOption(option =>
		  option
            .setName("player")
			.setDescription('The username/userid to be unbanned from wubby.')
			.setRequired(true)
		)
        .addStringOption(option =>
            option
              .setName("reason")
              .setDescription('The reason why the player was banned.')
        ),

	async execute(interaction) {
        const player = interaction.options.getString("player");
        const reason = (interaction.options?.getString("reason") || "No reason provided.");

        const unresolvedEmbed = new EmbedBuilder()
        .setTitle(`:information_source: Info`)
        .setDescription(`Resolving player...`)
        await interaction.reply({ embeds: [unresolvedEmbed] })

        let playerData = await getPlayerData(player)
        if (!playerData) {
            const notfoundEmbed = new EmbedBuilder()
            .setTitle(`:warning: Warning`)
            .setDescription(`\"${player}\" does not exist!`)
            .setColor(`#ffcc4d`)
            return await interaction.editReply({ embeds: [notfoundEmbed] })
        }
        let wubbyPlayerData = await getWubbyPlayerData(playerData.id)
        if (!wubbyPlayerData.ok) {
            switch(wubbyPlayerData.status) {
                case 503:
                    const apiUnavailableEmbed = new EmbedBuilder()
                    .setTitle(`:x: Error`)
                    .setDescription(`The wubby api is currently unavailable.`)
                    .setColor(`#dd2e44`)
                    return await interaction.editReply({ embeds: [apiUnavailableEmbed] })
                default:
                    const notWubbianEmbed = new EmbedBuilder()
                    .setTitle(`:warning: Alert`)
                    .setDescription(`\"${player}\" hasn't joined wubby yet!`)
                    .setColor(`#ffcc4d`)
                    return await interaction.editReply({ embeds: [notWubbianEmbed] })
            }
        }



        const pendingEmbed = new EmbedBuilder()
        .setTitle(`:information_source: Info`)
        .setDescription(`Attempting to unban ${playerData.name}...`)
        await interaction.editReply({ embeds: [pendingEmbed] })

        try {
            const successEmbed = new EmbedBuilder()
            .setTitle(`Successfully unbanned ${playerData.name}`)
            .setDescription(`[Click me to visit the player's roblox profile.](https://roblox.com/users/${playerData.id})`)
            .setColor(`#37d043`)
            .setThumbnail(`https://tools.choke.dev/roblox/avatar-thumbnails/v1/users/avatar?userId=${playerData.id}`)
            .addFields(
                { name: `Reason`, value: reason }
            )
            .setFooter({ text: `This DOES not actually unban a player, its here incase kory does decide to give me write access to wubby datastores.` })
            return await interaction.editReply({ embeds: [successEmbed] })

        } catch (error) {
            console.log(`An error occured: ${error}`)
            const failedEmbed = new EmbedBuilder()
            .setTitle(`Failed to ban ${playerData.name}!`)
            .setColor(`#dd2e44`)
            .setThumbnail(`https://tools.choke.dev/roblox/avatar-thumbnails/v1/users/avatar?userId=${playerData.id}`)
            .setDescription(`**Error**: ${error}`)
            return await interaction.editReply({ embeds: [failedEmbed] })
        }
    }
};
