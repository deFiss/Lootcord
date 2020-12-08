const max_disparity = 2
const flagged_threshold = 50000

module.exports = {
	name: 'trade',
	aliases: [''],
	description: 'Trade items and money with another player.',
	long: 'Lvl Required: 3+\nStart a trade with another user. Trade commands include:\n\n`add <item> <amount>` - Item to add to trade\n`remove <item>` - Remove item from trade\n`addmoney <amount>` - Amount of Credits to add\n`accept`\n`cancel`',
	args: { '@user': 'User to trade with.' },
	examples: ['trade @dream'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,
	levelReq: 3,

	async execute(app, message, { args, prefix }) {
		const user = app.parse.members(message, args)[0]

		if (!user) {
			return message.reply('❌ You need to mention the user you want to trade with.')
		}

		const victimRow = await app.player.getRow(user.id)

		if (user.id === app.bot.user.id) {
			return message.reply('I respectfully DECLINE')
		}
		else if (user.id === message.author.id) {
			return message.reply('❌ You can\'t trade with yourself.')
		}
		else if (!victimRow) {
			return message.reply('❌ The person you\'re trying to trade with doesn\'t have an account.')
		}
		else if (await app.cd.getCD(message.author.id, 'tradeban')) {
			return message.reply('❌ You are trade banned.')
		}
		else if (await app.cd.getCD(user.id, 'tradeban')) {
			return message.reply(`❌ **${user.nick || user.username}** is trade banned.`)
		}
		else if (await app.cd.getCD(user.id, 'banned')) {
			return message.reply(`❌ **${user.nick || user.username}** is banned.`)
		}
		else if (Math.floor((message.author.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
			return message.reply('❌ Your Discord account must be at least 30 days old to trade! This helps us prevent alt abuse. 😭')
		}
		else if (Math.floor((user.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
			return message.reply(`❌ **${user.nick || user.username}**'s Discord account must be at least 30 days old to trade! This helps us prevent alt abuse. 😭`)
		}
		else if (!await app.player.isActive(user.id, message.channel.guild.id)) {
			return message.reply(`❌ **${user.nick || user.username}** has not activated their account in this server.`)
		}
		else if (victimRow.level < this.levelReq) {
			return message.reply(`❌ **${user.nick || user.username}** is not level 3. The target player must be at least level 3.`)
		}
		else if (await app.cd.getCD(user.id, 'blinded')) {
			return message.reply(`❌ **${user.nick || user.username}** is blinded by a ${app.itemdata['40mm_smoke_grenade'].icon}\`smoke_grenade\`!`)
		}

		const botMessage = await message.channel.createMessage(`<@${user.id}>, **${message.member.nick || message.member.username}** would like to trade with you!`)

		try {
			const confirmed = await app.react.getConfirmation(user.id, botMessage)

			if (confirmed) {
				const player1Collector = app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => m.author.id === message.author.id, { time: 180000 })
				const player2Collector = app.msgCollector.createUserCollector(user.id, message.channel.id, m => m.author.id === user.id, { time: 180000 })

				let player1Money = 0
				let player2Money = 0
				const player1Items = []
				const player2Items = []

				player1Collector.collector.on('collect', m => {
					if (!m.content.toLowerCase().startsWith(prefix)) return

					const userArgs = m.content.slice(prefix.length).split(/ +/)

					return handleMsg(m, userArgs.slice(1), userArgs[0] || '', 1)
				})
				player2Collector.collector.on('collect', m => {
					if (!m.content.toLowerCase().startsWith(prefix)) return

					const userArgs = m.content.slice(prefix.length).split(/ +/)

					return handleMsg(m, userArgs.slice(1), userArgs[0] || '', 2)
				})

				player1Collector.collector.on('end', reason => {
					if (reason === 'time') {
						message.channel.createMessage('❌ The trade timed out.')
					}
				})

				// eslint-disable-next-line no-inner-declarations
				async function handleMsg(m, userArgs, command, player) {
					if (command.toLowerCase() === 'cancel') {
						app.msgCollector.stopCollector(player1Collector)
						app.msgCollector.stopCollector(player2Collector)

						message.channel.createMessage('Trade has been canceled.')
					}
					else if (command.toLowerCase() === 'accept') {
						if (!getValue(app, player2Money, player2Items) && !getValue(app, player1Money, player1Items)) return m.channel.createMessage('❌ You should add something to the trade!')
						app.msgCollector.stopCollector(player1Collector)
						app.msgCollector.stopCollector(player2Collector)

						if (player === 1) {
							const acceptMessage = await message.channel.createMessage(`<@${user.id}>, **${message.member.nick || message.member.username}** has accepted the trade! Do you accept?`)

							try {
								const accepted = await app.react.getConfirmation(user.id, acceptMessage)

								if (accepted) {
									try {
										const player1Val = getValue(app, player1Money, player1Items)
										const player2Val = getValue(app, player2Money, player2Items)

										await tradeItems(app, message.member, player1Money, player1Items, user, player2Money, player2Items)

										acceptMessage.edit('✅ Trade completed!')

										tradeCompleted(app, refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, prefix, true), message.channel.guild.id, message.member, user, player1Val, player2Val, player1Items, player2Items)
									}
									catch (err) {
										acceptMessage.edit(err.message)
									}
								}
								else {
									acceptMessage.edit(`❌ **${user.nick || user.username}** declined the trade.`)
								}
							}
							catch (err) {
								acceptMessage.edit(`❌ **${user.nick || user.username}** did not respond.`)
							}
						}
						else if (player === 2) {
							const acceptMessage = await message.channel.createMessage(`<@${message.author.id}>, **${user.nick || user.username}** has accepted the trade! Do you accept?`)

							try {
								const accepted = await app.react.getConfirmation(message.author.id, acceptMessage)

								if (accepted) {
									try {
										const player1Val = getValue(app, player1Money, player1Items)
										const player2Val = getValue(app, player2Money, player2Items)

										await tradeItems(app, message.member, player1Money, player1Items, user, player2Money, player2Items)

										acceptMessage.edit('✅ Trade completed!')

										tradeCompleted(app, refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, prefix, true), message.channel.guild.id, message.member, user, player1Val, player2Val, player1Items, player2Items)
									}
									catch (err) {
										acceptMessage.edit(err.message)
									}
								}
								else {
									acceptMessage.edit(`❌ **${message.member.nick || message.member.username}** declined the trade.`)
								}
							}
							catch (err) {
								acceptMessage.edit(`❌ **${message.member.nick || message.member.username}** did not respond.`)
							}
						}
					}
					else if (command.toLowerCase() === 'addmoney') {
						const row = await app.player.getRow(m.author.id)
						const amount = app.parse.numbers(userArgs)[0]

						if (!amount) {
							return m.channel.createMessage(`❌ You should specify an amount of Credits. You currently have **${app.common.formatNumber(row.money)}**`)
						}
						else if (row.money < amount) {
							return m.channel.createMessage(`❌ You don't have that much Credits. You currently have **${app.common.formatNumber(row.money)}**`)
						}

						if (player === 1) {
							player1Money += amount
						}
						else if (player === 2) {
							player2Money += amount
						}

						message.channel.createMessage(refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, prefix))
					}
					else if (command.toLowerCase() === 'add') {
						const item = app.parse.items(userArgs)[0]
						const amount = app.parse.numbers(userArgs)[0] || 1

						if (!item) {
							return m.channel.createMessage('❌ You need to specify an item.')
						}
						if (!app.itemdata[item].canBeStolen) {
							return m.channel.createMessage('❌ That item cannot be traded.')
						}

						if (player === 1) {
							if (listHasItem(player1Items, item)) {
								return m.channel.createMessage('❌ That item is already in the trade.')
							}
							if (!await app.itm.hasItems(await app.itm.getItemObject(m.author.id), item, amount)) {
								return m.channel.createMessage('❌ You don\'t have enough of that item.')
							}

							player1Items.push(`${item}|${amount}`)
						}
						else if (player === 2) {
							if (listHasItem(player2Items, item)) {
								return m.channel.createMessage('❌ That item is already in the trade.')
							}
							if (!await app.itm.hasItems(await app.itm.getItemObject(m.author.id), item, amount)) {
								return m.channel.createMessage('❌ You don\'t have enough of that item.')
							}

							player2Items.push(`${item}|${amount}`)
						}

						message.channel.createMessage(refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, prefix))
					}
					else if (command.toLowerCase() === 'remove') {
						const item = app.parse.items(userArgs)[0]

						if (userArgs[0] === 'money') {
							if (player === 1) {
								m.channel.createMessage(`Successfully removed ${app.common.formatNumber(player1Money)} from the trade.`)
								player1Money = 0
							}
							else if (player === 2) {
								m.channel.createMessage(`Successfully removed ${app.common.formatNumber(player2Money)} from the trade.`)
								player2Money = 0
							}
						}
						else if (!item) {
							return m.channel.createMessage('❌ You need to specify an item.')
						}
						else if (player === 1) {
							if (!listHasItem(player1Items, item)) {
								return m.channel.createMessage('❌ You don\'t have that item in the trade.')
							}

							for (let i = 0; i < player1Items.length; i++) {
								if (player1Items[i].split('|')[0] === item) {
									player1Items.splice(i, 1)
								}
							}

							m.channel.createMessage(`Item ${app.itemdata[item].icon}\`${item}\` removed.`)
						}
						else if (player === 2) {
							if (!listHasItem(player2Items, item)) {
								return m.channel.createMessage('❌ You don\'t have that item in the trade.')
							}

							for (let i = 0; i < player2Items.length; i++) {
								if (player2Items[i].split('|')[0] === item) {
									player2Items.splice(i, 1)
								}
							}

							m.channel.createMessage(`Item ${app.itemdata[item].icon}\`${item}\` removed.`)
						}

						message.channel.createMessage(refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, prefix))
					}
				}

				message.channel.createMessage(refreshWindow(app, message.member, 0, [], user, 0, [], prefix))
			}
			else {
				botMessage.edit(`❌ **${user.nick || user.username}** declined the trade.`)
			}
		}
		catch (err) {
			botMessage.edit(`❌ **${user.nick || user.username}** did not respond.`)
		}
	}
}

function refreshWindow(app, player1Member, player1Money, player1Items, player2Member, player2Money, player2Items, prefix, log = false) {
	const tradeWindow = new app.Embed()
		.setTitle('Trade Window')
		.setColor(2713128)
		.setDescription(`Reminder that handouts are not allowed, **giving** items/money to another player may result in punishment.\n\n**Commands:**\n\`${prefix}add <item> <amount>\`\n\`${prefix}addmoney <amount>\`\n\`${prefix}remove <item/money>\`\n\`${prefix}accept\`\n\`${prefix}cancel\``)
		.addField(log ? player1Member.username : `${player1Member.nick || player1Member.username}'s Offer`, app.common.formatNumber(player1Money), true)
		.addField(log ? player2Member.username : `${player2Member.nick || player2Member.username}'s Offer`, app.common.formatNumber(player2Money), true)
		.addBlankField(true)
		.addField('Items', getDisplay(app, player1Items, log).join('\n'), true)
		.addField('Items', getDisplay(app, player2Items, log).join('\n'), true)
		.addBlankField(true)
		.addBlankField()
		.addField('Value', app.common.formatNumber(getValue(app, player1Money, player1Items)), true)
		.addField('Value', app.common.formatNumber(getValue(app, player2Money, player2Items)), true)
		.addBlankField(true)

	return tradeWindow
}

function getValue(app, playerMoney, playerItems) {
	let value = playerMoney

	for (let i = 0; i < playerItems.length; i++) {
		value += app.itemdata[playerItems[i].split('|')[0]].sell * playerItems[i].split('|')[1]
	}

	return value
}

function getDisplay(app, itemList, log = false) {
	const items = []

	for (let i = 0; i < itemList.length; i++) {
		items.push(`${itemList[i].split('|')[1]}x ${!log ? app.itemdata[itemList[i].split('|')[0]].icon : ''}\`${itemList[i].split('|')[0]}\``)
	}

	if (!items.length) items.push('None')

	return items
}

function listHasItem(itemList, item) {
	for (let i = 0; i < itemList.length; i++) {
		if (itemList[i].split('|')[0] === item) return true
	}

	return false
}

async function tradeItems(app, player1, player1Money, player1Items, player2, player2Money, player2Items) {
	if (!await app.player.hasMoney(player1.id, player1Money)) throw new Error(`❌ **${player1.nick || player1.username}** does not have the money they wanted to trade.`)
	if (!await app.player.hasMoney(player2.id, player2Money)) throw new Error(`❌ **${player2.nick || player2.username}** does not have the money they wanted to trade.`)

	const player1ItemObj = await app.itm.getItemObject(player1.id)
	const player2ItemObj = await app.itm.getItemObject(player2.id)
	const player1ItemCt = await app.itm.getItemCount(player1ItemObj, await app.player.getRow(player1.id))
	const player2ItemCt = await app.itm.getItemCount(player2ItemObj, await app.player.getRow(player2.id))

	if (!await app.itm.hasItems(player1ItemObj, player1Items)) throw new Error(`❌ **${player1.nick || player1.username}** does not have the items they wanted to trade.`)
	if (!await app.itm.hasItems(player2ItemObj, player2Items)) throw new Error(`❌ **${player2.nick || player2.username}** does not have the items they wanted to trade.`)

	if (!await app.itm.hasSpace(player1ItemCt, app.itm.getTotalItmCountFromList(player2Items) - app.itm.getTotalItmCountFromList(player1Items))) throw new Error(`❌ **${player1.nick || player1.username}** does not have enough space in their inventory.`)
	if (!await app.itm.hasSpace(player2ItemCt, app.itm.getTotalItmCountFromList(player1Items) - app.itm.getTotalItmCountFromList(player2Items))) throw new Error(`❌ **${player2.nick || player2.username}** does not have enough space in their inventory.`)

	await app.player.removeMoney(player1.id, player1Money)
	await app.player.removeMoney(player2.id, player2Money)

	await app.itm.removeItem(player1.id, player1Items)
	await app.itm.removeItem(player2.id, player2Items)

	await app.player.addMoney(player1.id, player2Money)
	await app.player.addMoney(player2.id, player1Money)

	await app.itm.addItem(player1.id, player2Items)
	await app.itm.addItem(player2.id, player1Items)
}

function tradeCompleted(app, embed, guildID, player1, player2, player1Val, player2Val, player1Items, player2Items) {
	try {
		if (player1Val > player2Val * max_disparity && player1Val - player2Val >= flagged_threshold && app.itm.getTotalItmCountFromList(player1Items) > 1) {
			embed.setTitle('Trade Log (Flagged)')
			embed.setColor(16734296)
			embed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/triangular-flag-on-post_1f6a9.png')
		}
		else if (player2Val > player1Val * max_disparity && player2Val - player1Val >= flagged_threshold && app.itm.getTotalItmCountFromList(player2Items) > 1) {
			embed.setTitle('Trade Log (Flagged)')
			embed.setColor(16734296)
			embed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/triangular-flag-on-post_1f6a9.png')
		}
		else {
			embed.setTitle('Trade Log')
			embed.setColor(2713128)
			embed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/white-heavy-check-mark_2705.png')
		}

		embed.setDescription(`${player1.username}#${player1.discriminator} ID: \`\`\`\n${player1.id}\`\`\`${player2.username}#${player2.discriminator} ID: \`\`\`\n${player2.id}\`\`\`Guild ID: \`\`\`\n${guildID}\`\`\``)
		embed.setTimestamp()
		embed.setFooter('Keep an eye on users that trade low-value for high-value')

		app.messager.messageLogs(embed)
	}
	catch (err) {
		console.warn(err)
	}
}
