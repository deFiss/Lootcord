module.exports = {
	name: 'discord',
	aliases: ['disc', 'support', 'server'],
	description: 'Sends a link to the Star Wars Mercenaries War server.',
	long: 'Sends a link to the official Star Wars Mercenaries War Discord Server.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	execute(app, message, { args, prefix }) {
		message.channel.createMessage('Come join the discord server! Suggest new ideas, submit bug reports, join giveaways, get an exclusive first look at updates on the Star Wars Mercenaries War bot,\n\nor just chill and play Star Wars Mercenaries War with everyone 😃\nhttps://discord.gg/WKWCAt8yEd')
	}
}
