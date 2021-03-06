/**
 * @file Bugle Logger
 * @author RedPen
 * @since 1.0.0
 */

const {
	bugle_collect,
	cap_filter,
	channel_alert,
	channel_log,
	channel_raid,
	config,
	device_address,
	language,
	raid_collect,
	role_raid,
} = require("./../config.json")
const { WebhookClient } = require("discord.js")
const lang = require("./../lang/" + language + ".json")

module.exports = {
	name: "ready",
	once: true,

	/**
	 * @description Executes the block of code when client is ready (bot initialization)
	 * @param {import("discord.js").Client} client Main Application Client
	 * @param {import("discord.js").Guild} guild The Guild Object of the command.
	 */
	execute(client, guild) {
		console.log(lang.bugleLogger)
		var Cap = require("cap").Cap
		var decoders = require("cap").decoders
		var PROTOCOL = decoders.PROTOCOL
		var fs = require("fs")
		const channel = client.channels.cache.get(channel_log)
		const channelAlert = client.channels.cache.get(channel_alert)
		const channelRaid = client.channels.cache.get(channel_raid)

		var c = new Cap()
		var device = Cap.findDevice(device_address)
		var filter = cap_filter
		var bufSize = 10 * 1024 * 1024
		var buffer = Buffer.alloc(65535)
		var linkType = c.open(device, filter, bufSize, buffer)

		let raidType = [
			lang.raidLion,
			lang.raidAlligator,
			lang.raidSandworm,
			lang.raidRedDragon,
			lang.raidMammoth,
			lang.raidDesertDragon,
			lang.raidYeti,
			lang.raidIfrit,
			lang.raidPrairieDragon,
			lang.raidWhiteDragon,
			lang.raidBlackDragon,
			lang.raidMokkurkalfi,
			lang.raidSylvanDragon,
		]

		c.setMinBytes && c.setMinBytes(0)

		// Every time a packet is received, this function is called.
		c.on("packet", function (nbytes, trunc) {
			if (linkType === "ETHERNET") {
				var ret = decoders.Ethernet(buffer)

				if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
					ret = decoders.IPV4(buffer, ret.offset)

					if (ret.info.protocol === PROTOCOL.IP.TCP) {
						var datalen = ret.info.totallen - ret.hdrlen
						ret = decoders.TCP(buffer, ret.offset)
						datalen -= ret.hdrlen
						rcvStr = buffer.toString("utf8", ret.offset, ret.offset + datalen)
						var bugleClean = rcvStr.substring(rcvStr.indexOf("<ALL_CHANNELS>")).slice(18, -15)
						var bugleNick = bugleClean.substring(0, bugleClean.indexOf(" : "))
						var bugleData = bugleClean.substring(bugleClean.indexOf(" : ") + 3)
						var fieldRaid = rcvStr.substring(rcvStr.indexOf(lang.channel)).slice(7, -11)

						// Clean up bugleData and fieldRaid
						if (bugleData.includes("\x00")) {
							bugleData = bugleData.split("\x00")[0]
						} else if (fieldRaid.includes("\x00")) {
							fieldRaid = fieldRaid.split("\x00")[0]
						}

						// Current time
						let currDate = new Date()
						let hours = ("0" + currDate.getHours()).slice(-2)
						let minutes = ("0" + currDate.getMinutes()).slice(-2)
						let seconds = ("0" + currDate.getSeconds()).slice(-2)

						if (bugle_collect == "ON" && rcvStr.includes("<ALL_CHANNELS>")) {
							if (bugleData == "NaN" || bugleData == "undefined" || bugleData == NaN || bugleData == undefined) {
								return
							}

							// console.log(bugleNick + " : " + bugleData)

							if (config.bugle_style == "css") {
								channel.send(
									"```css\n[" + hours + ":" + minutes + ":" + seconds + "] " + bugleNick + " : " + bugleData + "\n```"
								)
							} else if (config.bugle_style == "plain") {
								channel.send("[" + hours + ":" + minutes + ":" + seconds + "] " + bugleNick + " : " + bugleData)
							} else if (config.bugle_style == "webhook") {
								new WebhookClient({
									id: config.webhookID,
									token: config.webhookToken,
								}).send({
									avatarURL: "https://api.multiavatar.com/" + bugleNick + ".png",
									username: bugleNick,
									content: bugleData,
								})
							}

							// Process user keywords
							const keywordDB = JSON.parse(fs.readFileSync("./commands/bugle/keywordDB.json", "utf8"))
							var messageQueue = []
							for (let i = 0; i < Object.keys(keywordDB).length; i++) {
								// NOTE: Only continue if member is in the guild
								// This only works if member has sends a message since the start of the bot
								// as the guild member cache is not updated until the member sends a message
								// if (guild.users.cache.has(Object.keys(keywordDB)[i])) {
								for (let j = 0; j < Object.values(keywordDB)[i].length; j++) {
									if (bugleData.includes(Object.values(keywordDB)[i][j]) == true) {
										let alertUserInfo = "<@!" + Object.keys(keywordDB)[i] + ">: " + Object.values(keywordDB)[i][j]
										messageQueue.push(alertUserInfo)
									}
								}
								// }
							}

							if (messageQueue.length != 0 && config.css == true) {
								channelAlert.send(
									"```css\n[" +
										hours +
										":" +
										minutes +
										":" +
										seconds +
										"] " +
										bugleNick +
										" : " +
										bugleData +
										"\n```\n>>> " +
										messageQueue.join(" | ")
								)
							} else if (messageQueue.length != 0 && config.css == false) {
								channelAlert.send(
									"[" +
										hours +
										":" +
										minutes +
										":" +
										seconds +
										"] " +
										bugleNick +
										" : " +
										bugleData +
										"\n>>> " +
										messageQueue.join(" | ")
								)
							}
						}

						// Raid alert
						if (raid_collect == "ON" && rcvStr.includes(lang.channel)) {
							if (fieldRaid == "NaN" || fieldRaid == "undefined" || fieldRaid == NaN || fieldRaid == undefined) {
								return
							}

							// Detect type of raid
							let fieldType = []
							for (i = 0; i < raidType.length; i++) {
								if (fieldRaid.includes(raidType[i])) {
									fieldType.push(raidType[i])
								}
							}

							// console.log(fieldRaid)
							if (config.css == true) {
								channelRaid.send(
									"```css\n[" +
										hours +
										":" +
										minutes +
										":" +
										seconds +
										"] " +
										lang.raidAlert_1 +
										fieldType.join(", ") +
										lang.raidAlert_2 +
										"\n```"
								)
							} else if (config.css == false) {
								channelRaid.send(
									"[" +
										hours +
										":" +
										minutes +
										":" +
										seconds +
										"] " +
										lang.raidAlert_1 +
										fieldType.join(", ") +
										lang.raidAlert_2
								)
							}
						}
					} else if (ret.info.protocol === PROTOCOL.IP.UDP) {
						console.log("Received UDP")
					} else console.log("Unsupported IPv4 protocol: " + PROTOCOL.IP[ret.info.protocol])
				} else console.log("Unsupported Ethertype: " + PROTOCOL.ETHERNET[ret.info.type])
			}
		})
	},
}
