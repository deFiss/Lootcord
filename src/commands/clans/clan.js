module.exports = {
	name: 'clan',
	aliases: ['clans'],
	description: 'The base command for everything to do with Mercenaries clans!',
	long: 'The base command for all clan commands. For a detailed look at all the clan commands and how clans work check out: https://www.mercs-war.online/clans/',
	args: {},
	examples: ['clan info mod squad'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)

		const commandName = args[0] ? args[0].toLowerCase() : undefined
		const command = app.clanCommands.get(commandName) || app.clanCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))

		if (!command) {
			try {
				return app.clanCommands.get('info').execute(app, message, { args, prefix })
			}
			catch (err) {
				console.log(err)
			}
		}
		else if (scoreRow.clanId === 0 && command.requiresClan) {
			return message.reply('❌ That command requires that you are a member of a clan.')
		}
		else if (command.requiresActive && !await app.player.isActive(message.author.id, message.channel.guild.id)) {
			return message.channel.createMessage(`❌ You need to activate before using that clan command here! Use \`${prefix}activate\` to activate.`)
		}
		else if (scoreRow.clanRank < command.minimumRank) {
			return message.reply(`❌ Your clan rank is not high enough to use this command! Your rank: \`${app.clan_ranks[scoreRow.clanRank].title}\` Required: \`${app.clan_ranks[command.minimumRank].title}\`+`)
		}
		else if (command.levelReq && scoreRow.level < command.levelReq) {
			return message.reply(`❌ You must be at least level \`${command.levelReq}\` to use this command!`)
		}

		try {
			command.execute(app, message, { args: args.slice(1), prefix })
		}
		catch (err) {
			console.log(err)
		}
	}
}
