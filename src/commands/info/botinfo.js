module.exports = {
	name: 'botinfo',
	aliases: ['update', 'info', 'version', 'stats'],
	description: 'Displays various information about the bot.',
	long: 'Displays information about the current update and the bot.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const used = process.memoryUsage().heapUsed / 1024 / 1024
		const stats = JSON.parse(await app.cache.get('stats')) || {}

		const embedInfo = new app.Embed()
			.setTitle('Star Wars Mercenaries War Update Info')
			.setColor(13451564)
			.setThumbnail(app.bot.user.avatarURL)
			.setDescription('Read [here](https://www.merc-wars.online/blog) for update details.\n\nStar Wars Mercenaries War is created by fans and is not affilated with Disney.')
			.addField('Shard ID', codeWrap(message.channel.guild.shard.id.toString(), 'js'), true)
			.addField('Cluster ID', codeWrap(app.clusterID.toString(), 'js'), true)
			.addField('Active Servers', codeWrap(stats.guilds || '1', 'js'), true)
			.addField('Uptime', codeWrap(app.cd.convertTime(app.bot.uptime), 'fix'), true)
			.addField('Memory Usage', codeWrap(`${Math.round(used)} MB`, 'fix'), true)
			.addField('Library', codeWrap('Eris', 'js'), true)
			.addField('Creators', 'dream#3333 / ᴰiᶻᵇᵃᵗⁱ#4239', true)
			.addField('Website', 'https://www.merc-wars.online/', true)
			.addField('Discord', 'https://discord.gg/W9kS9XGNCN', true)

		message.channel.createMessage(embedInfo)
	}
}

function codeWrap(input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}
