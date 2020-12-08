module.exports = {
	name: 'link',
	aliases: ['invite'],
	description: 'Sends a link to invite the bot.',
	long: 'Sends a link to invite the bot.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	execute(app, message, { args, prefix }) {
		const invite = new app.Embed()
			.setDescription('You can invite Star Wars Mercenaries War using this [link](https://discordapp.com/oauth2/authorize?&client_id=784863742827298848&scope=bot&permissions=387136 \'Click to invite Star Wars Mercenaries War\')!')
			.setColor(13451564)

		message.channel.createMessage(invite)
	}
}
