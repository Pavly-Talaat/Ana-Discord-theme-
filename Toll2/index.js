const { Plugin } = require("bunny");
const { http, Utilities } = require("bunny");

module.exports = class ServerCloner extends Plugin {
    async start() {
        this.registerCommand();
        console.log("🔥 ServerCloner نشط - جاهز للنسخ");
    }

    registerCommand() {
        this.commands?.add({
            name: "copy",
            description: "copy <source_id> <target_id>",
            execute: async (args, ctx) => {
                const [sourceId, targetId] = args;

                if (!sourceId || !targetId) {
                    return "⚠️ copy <source_id> <target_id>";
                }

                const token = Utilities.getToken();
                const api = "https://discord.com/api/v9";

                const sendMessage = async (content) => {
                    await http.post(`${api}/channels/${ctx.channel.id}/messages`, {
                        headers: { Authorization: token },
                        body: { content }
                    });
                };

                try {
                    await sendMessage("🔥 جاري استنساخ السيرفر...");

                    const source = await http.get(`${api}/guilds/${sourceId}`, {
                        headers: { Authorization: token }
                    });

                    if (!source?.body?.id) {
                        await sendMessage("❌ السيرفر المصدر غير موجود");
                        return;
                    }

                    const roles = await http.get(`${api}/guilds/${sourceId}/roles`, {
                        headers: { Authorization: token }
                    });

                    if (roles?.body?.length) {
                        for (const role of roles.body) {
                            if (role.name === "@everyone") continue;
                            await http.post(`${api}/guilds/${targetId}/roles`, {
                                headers: { Authorization: token },
                                body: {
                                    name: role.name,
                                    color: role.color,
                                    permissions: role.permissions?.toString?.() || "0"
                                }
                            });
                            await this.delay(500);
                        }
                    }

                    const channels = await http.get(`${api}/guilds/${sourceId}/channels`, {
                        headers: { Authorization: token }
                    });

                    if (channels?.body?.length) {
                        for (const channel of channels.body) {
                            if (channel.type === 4) continue;
                            await http.post(`${api}/guilds/${targetId}/channels`, {
                                headers: { Authorization: token },
                                body: {
                                    name: channel.name,
                                    type: channel.type,
                                    topic: channel.topic || "",
                                    nsfw: channel.nsfw || false
                                }
                            });
                            await this.delay(500);
                        }
                    }

                    await sendMessage(`✅ تم استنساخ \`${source.body.name}\` إلى السيرفر \`${targetId}\` بنجاح`);
                } catch (error) {
                    await sendMessage(`❌ فشل: ${error.message || error}`);
                }
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
        this.commands?.removeAll();
    }
};
