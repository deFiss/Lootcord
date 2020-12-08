const CronJob = require('cron').CronJob
const shopData = require('../resources/json/shop')
const STATUS_LIST = [
	'Looting {users} players',
	'{users} Mercenaries',
	'{guilds} servers!',
	'Join the discord!',
	'http://www.merc-wars.online/ 👀'
]

class LoopTasks {
	constructor(app) {
		this.app = app
		this.daily = new CronJob('0 0 0 * * *', this.dailyTasks.bind(this), null, false, 'America/New_York')
		this.refreshLBJob = new CronJob('0 */6 * * *', this.refreshLB.bind(this), null, false, 'America/New_York')
		this.biHourly = new CronJob('0 */2 * * *', this.biHourlyTasks.bind(this), null, false, 'America/New_York')
		this.hourly = new CronJob('0 * * * *', this.hourlyTasks.bind(this), null, false, 'America/New_York')
		this.removePatrons = new CronJob('0 0 2 * *', () => { this.app.ipc.broadcast('removePatrons', {}) }, null, false, 'America/New_York')
		this.firstOfMonth = new CronJob('0 0 1 * *', this.monthlyTasks.bind(this), null, false, 'America/New_York')

		// every 3 minutes
		this.often = new CronJob('*/3 * * * *', this.frequentTasks.bind(this), null, false, 'America/New_York')
	}

	start() {
		if (this.app.clusterID === 0) {
			console.log('[LOOPTASKS] Starting daily/bi-hourly tasks...')
			this.daily.start()
			this.refreshLBJob.start()
			this.biHourly.start()
			this.often.start()
			this.removePatrons.start()
			this.firstOfMonth.start()
		}

		this.hourly.start()
	}

	async monthlyTasks() {
		await this.app.query('UPDATE scores SET points = 0, level = 1')
	}

	async dailyTasks() {
		console.log('[LOOPTASKS] Running daily tasks...')
		// reroll scrap deals in shop
		await this.restockShop()

		// take clan upkeep costs
		const clans = await this.app.query('SELECT clanId, money, reduction FROM clans')
		let moneyRemoved = 0
		let itemsRemoved = 0
		let decayingClans = 0

		for (let i = 0; i < clans.length; i++) {
			const clanData = await this.app.clans.getClanData(clans[i])
			const upkeep = this.app.clans.getUpkeep(clans[i].money, clanData.memberCount, clanData.inactiveMemberCount)

			if (clans[i].money >= upkeep) {
				await this.app.clans.removeMoney(clans[i].clanId, upkeep)
				moneyRemoved += upkeep
				decayingClans++
			}
			else if (clanData.usedPower >= 1) {
				const randomItem = await this.app.itm.getRandomUserItems(clans[i].clanId, 1)
				await this.app.itm.removeItem(clans[i].clanId, randomItem.items[0], 1)
				await this.app.clans.addLog(clans[i].clanId, `The vault lost 1x ${randomItem.items[0]} due to cost of upkeep`)
				itemsRemoved++
				decayingClans++
			}
		}

		// remove old logs
		await this.app.query('DELETE FROM clan_logs WHERE logDate < NOW() - INTERVAL 30 DAY')

		// remove old transactions
		await this.app.query('DELETE FROM transactions WHERE date < NOW() - INTERVAL 30 DAY')

		// reset daily limits
		await this.app.query('UPDATE scores SET discoinLimit = 0, bmLimit = 0 WHERE discoinLimit != 0 OR bmLimit != 0')

		// auto-deactivate players who have not played for 7 days
		const InactiveUsers = await this.app.query('SELECT scores.userId, guildId, lastActive FROM userGuilds INNER JOIN scores ON userGuilds.userId = scores.userId WHERE scores.lastActive < NOW() - INTERVAL 7 DAY')
		let activeRolesRemoved = 0

		for (let i = 0; i < InactiveUsers.length; i++) {
			if (Object.keys(this.app.config.activeRoleGuilds).includes(InactiveUsers[i].guildId)) {
				this.app.ipc.broadcast('removeActiveRole', {
					guildId: InactiveUsers[i].guildId,
					userId: InactiveUsers[i].userId,
					roleId: this.app.config.activeRoleGuilds[InactiveUsers[i].guildId].activeRoleID
				})

				activeRolesRemoved++
			}
		}
		console.log(`[LOOPTASKS] Removed active role from ${activeRolesRemoved} players.`)

		await this.app.query('DELETE FROM userGuilds USING userGuilds INNER JOIN scores ON userGuilds.userId = scores.userId WHERE scores.lastActive < NOW() - INTERVAL 7 DAY')

		const dailyEmbed = new this.app.Embed()
			.setTitle('Daily Tasks')
			.setDescription(`Removed ${this.app.common.formatNumber(moneyRemoved)} and **${itemsRemoved}** items from **${decayingClans}** decaying clans.`)
			.setColor('#ffffff')
		this.app.messager.messageLogs(dailyEmbed)
	}

	async restockShop() {
		await this.app.query('DELETE FROM shopData WHERE item != \'\'')

		const items = this.app.common.shuffleArr(Object.keys(shopData)).slice(0, 3)

		for (const item of items) {
			const itemInfo = shopData[item]
			const price = Math.floor((Math.random() * (itemInfo.maxPrice - itemInfo.minPrice + 1)) + itemInfo.minPrice)
			const stock = Math.floor((Math.random() * (itemInfo.maxStock - itemInfo.minStock + 1)) + itemInfo.minStock)

			await this.app.query('INSERT INTO shopData (itemName, itemAmount, itemPrice, itemCurrency, itemDisplay, item) VALUES (?, ?, ?, ?, ?, ?)',
				[itemInfo.buyName, stock, price, 'scrap', item, item])
		}
	}

	async refreshLB() {
		console.log('[LOOPTASKS] Refreshing global leaderboard...')
		const leaders = await this.app.leaderboard.getLB()
		const patrons = await this.app.patreonHandler.getPatrons(2)
		this.app.cache.setNoExpire('leaderboard', JSON.stringify(leaders))
		this.app.cache.setNoExpire('patronsCache', JSON.stringify(patrons))
	}

	async biHourlyTasks() {
		console.log('[LOOPTASKS] Running bi-hourly tasks...')
		// add 1 power to all active players every 2 hours
		await this.app.query('UPDATE scores SET power = power + 1 WHERE power < max_power AND lastActive > NOW() - INTERVAL 14 DAY;')

		// remove 1 power for players inactve over 2 weeks, down to minimum of 0
		await this.app.query('UPDATE scores SET power = power - 1 WHERE power > 0 AND lastActive < NOW() - INTERVAL 14 DAY')

		// clean up cooldown table
		this.app.query('DELETE FROM cooldown WHERE UNIX_TIMESTAMP() * 1000 > start + length')
	}

	async hourlyTasks() {
		const stats = JSON.parse(await this.app.cache.get('stats')) || {}

		if (this.app.bot.shards.get([...this.app.bot.shards][0][0]).presence.game.type === 2) return

		if (stats.guilds) {
			this.app.bot.editStatus('online', {
				name: `t-help | ${STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)].replace('{users}', this.app.common.formatNumber(stats.users, true)).replace('{guilds}', this.app.common.formatNumber(stats.guilds, true))}`,
				type: 0
			})
		}
	}

	async frequentTasks() {
		if (!this.app.config.debug && this.app.clusterID === 0) {
			await this._handleDiscoinTransactions()
		}

		await this.app.ipc.broadcast('refreshPatrons', {})
	}

	async _handleDiscoinTransactions() {
		try {
			const unhandled = await this.app.discoin.getUnhandled()
			/* test transaction
            const unhandled = {
                data: [
                    {
                        "id":"8fd3e69d-c7d3-4a07-95bc-687f588a49c2",
                        "amount":"100",
                        "user":"168958344361541633",
                        "handled":false,
                        "timestamp":"2020-05-24T19:44:20.586Z",
                        "payout":950000,
                        "from":{
                            "id":"SPN",
                            "name":"Nova Supernova",
                            "value":0.187,
                            "reserve":"53547384.17"
                        },
                        "to":{
                            "id":"LCN",
                            "name":"Lootcord Lootcoin",
                            "value":0.8,
                            "reserve":"67719.17"
                        }
                    }
                ]
            }
            */
			const logTransactions = []

			for (let i = 0; i < unhandled.data.length; i++) {
				const transaction = unhandled.data[i]
				let payout = Math.round(transaction.payout)
				let refunded = 0
				let userRow = await this.app.player.getRow(transaction.user)
				await this.app.discoin.handle(transaction.id)

				if (!userRow) {
					// create account for user if they dont have one
					await this.app.player.createAccount(transaction.user)

					userRow = await this.app.player.getRow(transaction.user)
				}

				const embed = new this.app.Embed()
					.setTitle('Conversion Successful')
					.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png')
					.setDescription(`You received ${this.app.common.formatNumber(payout)} (${transaction.payout} rounded) through Discoin! [Click this to see more details.](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)\n\nKeep in mind there is a daily limit of ${this.app.common.formatNumber(100000)} on incoming transactions.`)
					.setColor(13451564)

				if (userRow.discoinLimit + payout > 100000) {
					if (userRow.discoinLimit >= 100000) {
						// user hit daily limit, refund everything
						refunded = payout
						payout = 0
					}
					else {
						refunded = Math.abs(100000 - (userRow.discoinLimit + payout))
						payout -= refunded
					}

					try {
						await this.app.discoin.request(transaction.user, refunded, transaction.from.id)
					}
					catch (err) {
						console.error(err)

						// idk discoin not working so just give them all money, this is very unlikely to happen tho since discoin.handle() would error before this
						refunded = 0
						payout = Math.round(transaction.payout)
					}

					embed.setDescription(`**Oh no!**\nIt looks like you hit the daily transaction limit of **${this.app.common.formatNumber(100000)}**\n\nYou still received **${this.app.common.formatNumber(payout)}**, the other **${this.app.common.formatNumber(refunded)}** was automatically sent back to **${transaction.from.id}**.\n\nThis limit helps keep our economy stable!`)
				}

				await this.app.query('UPDATE scores SET discoinLimit = discoinLimit + ? WHERE userId = ?', [payout, transaction.user])
				this.app.player.addMoney(transaction.user, payout)
				this.app.common.messageUser(transaction.user, embed)

				const logEmbed = new this.app.Embed()
					.setTitle('Discoin Conversion')
					.setDescription(`${transaction.from.name}(${transaction.from.id}) to Credits\n\n[Link](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)`)
					.addField('Credits Payout', `${this.app.common.formatNumber(payout)} (${this.app.common.formatNumber(refunded)} refunded)`, true)
					.addField('User', `\`\`\`\n${transaction.user}\`\`\``)
					.setFooter(`Transaction ID: ${transaction.id}`)
					.setColor(13451564)

				logTransactions.push(logEmbed)
			}

			if (logTransactions.length) this.app.messager.messageLogs(logTransactions)
			console.log(`[DISCOIN] Successfully handled ${unhandled.data.length} transactions.`)
		}
		catch (err) {
			console.log('[DISCOIN] API error:')
			console.log(err)
		}
	}

	async _refreshBlacklist() {
		try {
			const list = await this.app.noflylist.getList()
			let totalBanned = 0

			for (let i = 0; i < list.length; i++) {
				if (await this.app.cd.getCD(list[i].discordId, 'banned')) continue
				const reason = `Automatically banned using the no fly list for reason: ${list[i].reason}`

				await this.app.query('INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)', [list[i].discordId, reason, new Date(list[i].dateBlacklisted).getTime()])
				await this.app.cache.setNoExpire(`banned|${list[i].discordId}`, 'Banned perma')

				console.log(`[LOOPTASKS] Banned user ${list[i].discordId} using no fly list.`)
				totalBanned++
			}

			return `Banned ${totalBanned} users using the no fly list.`
		}
		catch (err) {
			console.warn('Unable to refresh the global blacklist:')
			console.warn(err)
		}
	}
}

module.exports = LoopTasks
