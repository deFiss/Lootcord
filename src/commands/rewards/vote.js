module.exports = {
	name: 'vote',
	aliases: [''],
	description: 'Vote for the bot to collect a reward!',
	long: 'Vote for the bot to receive a reward.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const voteCD = await app.cd.getCD(message.author.id, 'vote')
		const vote2CD = await app.cd.getCD(message.author.id, 'vote2')

		message.reply(getVotesAvailable(voteCD, vote2CD))
	}
}

function getVotesAvailable(vote1CD, vote2CD) {
	let str = '🎟 Vote for the bot to collect a reward!'

	if (vote1CD) str += `\n\n**Top.gg**: \`${vote1CD}\``
	else str += '\n\n**Top.gg**: ✅ Available! https://top.gg/bot/1111111111/vote'

	if (vote2CD) str += `\n**Bots For Discord**: \`${vote2CD}\``
	else str += '\n**Bots For Discord**: ✅ Available! https://botsfordiscord.com/bot/1111111111/vote'

	str += '\n\nVote on both websites for double the reward, you should receive a DM after you vote.'

	return str
}
