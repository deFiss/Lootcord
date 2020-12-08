module.exports = {
	name: 'report',
	aliases: [''],
	description: 'Report another player for breaking the rules.',
	long: 'Send a report to the moderators. Examples include cheaters, alt accounts or just general errors you have with the bot. Supports image attachments.',
	args: { message: 'The content of your report.' },
	examples: ['report dream#3333 looked at me funny'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const messageIn = args.join(' ')
		const reportCD = await app.cd.getCD(message.author.id, 'report')

		if (reportCD) {
			return message.reply(`You just sent a report! Wait \`${reportCD}\` before sending another.`)
		}
		else if (messageIn === '') {
			return message.reply(`You forgot to put a message! \`${prefix}report <content>\``)
		}

		const botMessage = await message.reply('Submit report?\n\n**Spamming this command or using it for purposes other than reporting will result in a warning or ban.**')

		try {
			const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

			if (confirmed) {
				const imageAttached = message.attachments

				const reportEmbed = new app.Embed()
					.setAuthor('New Report')
					.setThumbnail(message.author.avatarURL)
					.addField('Submitted by', `${`${message.author.username}#${message.author.discriminator}`}\n(${message.author.id})`)
					.addField('Message', messageIn)
					.addField('Message Link', `https://discord.com/channels/${message.channel.guild.id}/${message.channel.id}/${message.id}`)
					.setFooter(`Respond with t-message ${message.author.id} <message>`)
					.setColor(16734296)

				if (Array.isArray(imageAttached) && imageAttached.length) {
					if (imageAttached[0].url.endsWith('.mp4') || imageAttached[0].url.endsWith('.mp3')) {
						reportEmbed.addField('File', imageAttached[0].url)
					}
					else {
						reportEmbed.setImage(imageAttached[0].url)
					}
				}

				app.messager.messageMods({ embed: reportEmbed.embed }, { ping: false })

				app.cd.setCD(message.author.id, 'report', 300 * 1000)

				botMessage.edit('Report successfully sent!')
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit('You didn\'t react in time!')
		}
	}
}
