const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const parse = require('parse-duration')

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
                usernames: [String(user)],
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
		.setName("globalban")
		.setDescription("Bans a player from wubby.")
        .addStringOption(option =>
		  option
            .setName("player")
			.setDescription('The username/userid to be banned from wubby.')
			.setRequired(true)
		)
        .addStringOption(option =>
            option
              .setName("duration")
              .setDescription('How long should the player be banned from wubby? (30s, 1m, 12h, 7d, 2w, 6b, 1y)')
              .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
              .setName("reason")
              .setDescription('The reason why the player was banned.')
        ),

	async execute(interaction) {
        const player = interaction.options.getString("player");
        const duration = interaction.options?.getString("duration");
        const parsedDuration = parse(duration);
        const reason = (interaction.options?.getString("reason") || "No reason provided.");

        const isPermBan = !duration || isNaN(parsedDuration);

        if (!parsedDuration && duration) {
            const invalidargsEmbed = new EmbedBuilder()
            .setTitle(`:x: Error`)
            .setDescription(`Invalid \"duration\" argument.`)
            .setColor(`#dd2e44`)
            return await interaction.reply({ embeds: [invalidargsEmbed] })
        }

        const unresolvedEmbed = new EmbedBuilder()
        .setTitle(`:information_source: Info`)
        .setDescription(`Resolving player...`)
        await interaction.reply({ embeds: [unresolvedEmbed] })

        let playerData = await getPlayerData(player)
        if (!playerData) {
            const notfoundEmbed = new EmbedBuilder()
            .setTitle(`:warning: Alert`)
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
        .setDescription(`Attempting to ban ${playerData.name}...`)
        await interaction.editReply({ embeds: [pendingEmbed] })

        const { Universe, DataStore } = await import('@daw588/roblox.js');
        const universe = new Universe(4398901283, process.env["API_KEY"]);
        const DS_Players = new DataStore(universe, "MyGames");

        try {
            const wubbyPlayerData = await DS_Players.GetAsync(String(playerData.id))

            console.log(wubbyPlayerData, typeof wubbyPlayerData)

            wubbyPlayerData.DefaultRank = isPermBan ? -2 : -1
            wubbyPlayerData.S = isPermBan ? null : (Date.now() + parsedDuration)
            await DS_Players.SetAsync(String(playerData.id), wubbyPlayerData);

            const successEmbed = new EmbedBuilder()
            .setTitle(`:white_check_mark: Success`)
            .setDescription(`Successfully banned ${playerData.name}\n[Click me to visit the player's roblox profile.](https://roblox.com/users/${playerData.id})`)
            .setColor(`#37d043`)
            .setThumbnail(`https://tools.choke.dev/roblox/avatar-thumbnails/v1/users/avatar?userId=${playerData.id}`)
            .addFields(
                { name: `:hammer: Ban Type`, value: (isPermBan ? `Permanent` : `Temporary`) },
                { name: `:question: Reason`, value: reason }
            )
            .setFooter({ text: `This DOES not actually ban a player, its here incase kory does decide to give me write access to wubby datastores.` })
            if (!isPermBan) { successEmbed.addFields({ name: `:clock4: Duration`, value: `${duration} (Expires in <t:${Math.floor(Date.now() / 1000) + (parsedDuration / 1000)}>)` }) }
            return await interaction.editReply({ embeds: [successEmbed] })

        } catch (error) {
            console.log(`An error occured: ${error.stack}`)
            const failedEmbed = new EmbedBuilder()
            .setTitle(`:x: Error`)
            .setDescription(`Failed to ban ${playerData.name}!`)
            .setColor(`#dd2e44`)
            .setThumbnail(`https://tools.choke.dev/roblox/avatar-thumbnails/v1/users/avatar?userId=${playerData.id}`)
            .setDescription(error)
            return await interaction.editReply({ embeds: [failedEmbed] })
        }
    }
};
