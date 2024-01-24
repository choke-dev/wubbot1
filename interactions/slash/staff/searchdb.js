const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	// The data needed to register slash commands to Discord.

	data: new SlashCommandBuilder()
		.setName("searchdb")
		.setDescription("Searches the wubby world database for the specified user input.")
    .addStringOption(option =>
		  option
        .setName("field")
			  .setDescription('Specifies what to search in')
			  .setRequired(true)
			  .addChoices(
			  	{ name: 'Names', value: 'name' },
			  	{ name: 'Descriptions', value: 'description' },
          { name: 'User IDs', value: 'creator_id' }  
			  ))
		.addStringOption((option) =>
			option
				.setName("query")
				.setDescription("Specifies what to query in the database.")
        .setRequired(true)
		),

	async execute(interaction) {
    const { default: postgres } = await import('postgres')
    const sql = postgres(`postgres://${process.env["DB_USER"]}:${process.env["DB_PASSWORD"]}@192.168.1.99:5432/${process.env["DB_NAME"]}`, {
        host                 : 'localhost',            // Postgres ip address[s] or domain name[s]
        port                 : 5432,          // Postgres server port[s]
        database             : process.env["DB_NAME"],            // Name of database to connect to
        username             : process.env["DB_USER"],            // Username of database user
        password             : process.env["DB_PASSWORD"],            // Password of database user
    })
    
    const targetField = await interaction.options.getString("field")
    const searchQuery = await interaction.options.getString("query")
    
    let worlds;

    switch(targetField) {
      case "creator_id":

        if (isNaN(searchQuery)) {
          return await interaction.reply(`:x: Your search query must be numbers only.`)
        }

        worlds = await sql`
        select * from worlds where ${sql(targetField)} = ${sql.unsafe(Number(searchQuery))}::bigint limit 25
        `
        break;
      default:
        // no sanitizing needed because the library automatically does this (except for sql.unsafe)
        worlds = await sql`
        select * from worlds where ${sql(targetField)} ilike ${'%' + searchQuery + '%'} limit 25
        `
    }

    let searchResultData = [];
    for (dataindex in worlds) {
      const worldData = worlds[dataindex]
      searchResultData.push({
        name: `${worldData.name}`,
        value: `
        World ID: ${worldData.worldid}
        Creator ID: ${worldData.creator_id}
        Image ID: ${worldData.image_id}
        Description: ${worldData.description}
        `
      })
    }

    const searchResultEmbed = new EmbedBuilder().setColor("Random");
    searchResultEmbed
    .setTitle(`Search results for \"${searchQuery}\" in ${targetField}s`)
    .setDescription(`Found ${worlds.count} worlds`)
    .addFields(searchResultData)
    .setFooter({ text: 'The data you are currently looking at was downloaded on January 4, 2023 @ 7:26PM UTC+0 and is incomplete.', iconURL: 'https://imgur.com/cm8ngAb.png' })
    

		await interaction.reply({
			embeds: [searchResultEmbed],
		});
	},
};
