/**
 * @file Modal Interaction Handler
 * @author Naman Vrati
 * @since 3.2.0
 * @version 3.2.2
 */

module.exports = {
	name: "interactionCreate",

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author Naman Vrati
	 * @param {import("discord.js").Interaction} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction

		// Checks if the interaction is a modal interaction (to prevent weird bugs)

		if (!interaction.isModalSubmit()) return

		const command = client.modalCommands.get(interaction.customId)

		// If the interaction is not a command in cache, return error message.
		// You can modify the error message at ./messages/defaultModalError.js file!

		if (!command) {
			await require("../messages/defaultModalError").execute(interaction)
			return
		}

		// A try to execute the interaction.

		try {
			await command.execute(interaction)
			return
		} catch (err) {
			console.error(err)
			await interaction.reply({
				content: "해당 모달을 이해하는데에 에러가 발생했습니다.",
				ephemeral: true,
			})
			return
		}
	},
}
