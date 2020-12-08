module.exports = {
	name: 'balance',
	aliases: ['cash', 'money', 'bal', 'credits'],
	description: 'Displays your current balance.',
	long: 'Displays your current Credits and Scrap balance.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const row = await app.player.getRow(message.author.id)

		message.reply(`You currently have:\n\nCredits: ${app.common.formatNumber(row.money)}\nScrap: ${app.common.formatNumber(row.scrap, false, true)}`)
	}
}
