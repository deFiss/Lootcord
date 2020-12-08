const usersPerPage = 10

module.exports = {
	name: 'active',
	aliases: ['players'],
	description: 'Displays all active Mercenaries on the server.',
	long: 'Displays all active Mercenaries on the server.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const guildUsers = []
		const clans = []
		const rows = await app.query(`SELECT scores.userId, badge
        FROM scores
        INNER JOIN userGuilds
        ON scores.userId = userGuilds.userId
        WHERE guildId = "${message.channel.guild.id}"
        ORDER BY LOWER(scores.userId)`)

		const clanRows = await app.query(`SELECT DISTINCT clans.name FROM (
            SELECT scores.clanId
            FROM userGuilds
            INNER JOIN scores
            ON userGuilds.userId = scores.userId
            WHERE userGuilds.guildId = ${message.channel.guild.id}
        ) c
        INNER JOIN clans
        ON c.clanId = clans.clanId`)

		for (let i = 0; i < rows.length; i++) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, rows[i].userId)

				guildUsers.push(`${app.player.getBadge(rows[i].badge)} ${member.nick || member.username}`)
			}
			catch (err) {
				// continue
			}
		}
		for (let i = 0; i < clanRows.length; i++) {
			clans.push(clanRows[i].name)
		}

		if (guildUsers.length > usersPerPage) {
			const pages = []

			// max page is based off of active users because there will never be more active clans than there are active users
			const maxPage = Math.ceil(guildUsers.length / usersPerPage)

			for (let i = 1; i < maxPage + 1; i++) {
				// create each page for pagination
				const page = getEmbedPage(app, guildUsers, clans, i, usersPerPage)

				if (message.channel.guild.iconURL) page.setThumbnail(message.channel.guild.iconURL)
				pages.push(page)
			}

			app.react.paginate(message, pages)
		}
		else {
			const page = getEmbedPage(app, guildUsers, clans, 1, usersPerPage)

			if (message.channel.guild.iconURL) page.setThumbnail(message.channel.guild.iconURL)
			message.channel.createMessage(page)
		}
	}
}

function getEmbedPage(app, guildUserList, guildClanList, pageNum, perPage) {
	const indexFirst = (perPage * pageNum) - perPage
	const indexLast = perPage * pageNum

	const newEmbed = new app.Embed()
		.setColor(13451564)
		.addField(`**Active Players** (${guildUserList.length})`, guildUserList.map((user, index) => `${index + 1}. **${user}**`).slice(indexFirst, indexLast).join('\n'))

	if (guildClanList.length) newEmbed.addField(`**Active Clans** (${guildClanList.length})`, guildClanList.map((clan, index) => `${index + 1}. \`${clan}\``).slice(indexFirst, indexLast).join('\n') || '\u200b')

	return newEmbed
}
