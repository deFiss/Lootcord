exports.debug = process.env.NODE_ENV !== 'production'

exports.prefix = 't-'

// IDs of users that have admin privileges.
exports.adminUsers = ['319036148662009857', '318286931815563265']

exports.botToken = process.env.BOT_TOKEN

exports.discoinToken = process.env.DISCOIN_TOKEN

exports.nflToken = process.env.NOFLYLIST_TOKEN

// secret for requests to api
exports.apiAuth = process.env.API_AUTH
exports.serverPort = process.env.API_PORT || 5000

// ID of the bots main guild, used for handling patreon roles and the 2x reward on daily command
exports.supportGuildID = process.env.BOT_GUILD

// ID of channel where certain moderation commands have to be run
exports.modChannel = process.env.BOT_MODERATION_CHANNEL

// ID of role to ping mods
exports.modRoleID = process.env.MOD_ROLE_ID

// The amount of inventory slots with no backpack
exports.baseInvSlots = 15

// Information used to connect to SQL database
exports.sql = {
	host: process.env.MYSQL_HOSTNAME,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE
}

// Config for connecting to redis
exports.redis = {
	host: process.env.REDIS_HOSTNAME,
	password: process.env.REDIS_PASSWORD
}

// Discord webhook to send logs to
exports.logWebhook = {
	id: process.env.LOGS_WEBHOOK_ID,
	token: process.env.LOGS_WEBHOOK_TOKEN
}

// IDs of guilds the bot will ignore (not respond)
exports.ignoredGuilds = ['264445053596991498', '374071874222686211', '446425626988249089']

exports.donatorRoles = {
	kofi: process.env.KOFI_ROLE_ID,
	tier1Patreon: process.env.TIER1_PATREON_ROLE_ID,
	tier2Patreon: process.env.TIER2_PATREON_ROLE_ID,
	tier3Patreon: process.env.TIER3_PATREON_ROLE_ID,
	tier4Patreon: process.env.TIER4_PATREON_ROLE_ID
}

// Bot lists to post stats to
exports.botLists = [
	{
		url: 'https://top.gg/api/bots/784863742827298848/stats',
		token: process.env.TOPGG_API_TOKEN
	},
	{
		url: 'https://discord.bots.gg/api/v1/bots/784863742827298848/stats',
		token: process.env.BOTSGG_API_TOKEN
	},
	{
		url: 'https://botsfordiscord.com/api/bot/784863742827298848',
		token: process.env.BFD_API_TOKEN
	},
	{
		url: 'https://discordbotlist.com/api/v1/bots/493316754689359874/stats',
		token: process.env.DBL_API_TOKEN
	}
]

/**
 * IDs of guilds where the bot will give a role to players that activate their account
 * this requires the manage roles permission
 */
exports.activeRoleGuilds = {
	'497302646521069568': {
		activeRoleID: '585640212047069185'
	}
}

// Permissions required for the bot to work
// TODO check for permissions needed based on command being used
exports.requiredPerms = {
	sendMessages: 'Send Messages',
	addReactions: 'Add Reactions',
	// manageMessages: 'Manage Messages',
	embedLinks: 'Embed Links',
	attachFiles: 'Attach Files',
	externalEmojis: 'Use External Emoji',
	readMessageHistory: 'Read Message History'
}

// cooldowns in seconds for some commands
exports.cooldowns = {
	hourly: 3600,
	daily: 86400,
	blackjack: 180,
	coinflip: 180,
	scramble: 900,
	trivia: 900,
	roulette: 180,
	slots: 180,
	jackpot: 300,
	xp_potion: 150
}
