module.exports = {
	name: 'setammo',
	aliases: [''],
	description: 'Sets preferred ammo type.',
	long: 'Sets your preferred ammunition. This ammo will be prioritized when using weapons even if you have a better ammo type in your inventory.',
	args: { item: 'Ammo to set as preferred' },
	examples: ['setammo rifle_blaster_he_cell'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const equipItem = app.parse.items(args)[0]

		if (args[0] && args[0].toLowerCase() === 'none') {
			await app.query(`UPDATE scores SET ammo = 'none' WHERE userId = ${message.author.id}`)

			return message.reply('✅ Successfully cleared your preferred ammo type. (Best ammo available will be used.)')
		}
		else if (!equipItem) {
			return message.reply('❌ I don\'t recognize that item.')
		}
		else if (app.itemdata[equipItem].category !== 'Ammo') {
			return message.reply('❌ That isn\'t a type of ammunition.')
		}
		else if (!await app.itm.hasItems(await app.itm.getItemObject(message.author.id), equipItem, 1)) {
			return message.reply(`❌ You don't own any ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
		}

		await app.query(`UPDATE scores SET ammo = '${equipItem}' WHERE userId = ${message.author.id}`)

		message.reply(`✅ Successfully set ${app.itemdata[equipItem].icon}\`${equipItem}\` as your preferred ammo type. (Will prioritize over other ammo types.)`)
	}
}
