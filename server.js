require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Bot instances
let announcementBot = null;
let selfBot = null;

// Routes
app.post('/api/announcement/start', async (req, res) => {
    try {
        const { token, message, servers, sendTo, delay } = req.body;

        if (announcementBot) await announcementBot.destroy();

        announcementBot = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages
            ]
        });

        announcementBot.on('ready', async () => {
            try {
                const guilds = announcementBot.guilds.cache.filter(g => servers.includes(g.id));
                res.json({ 
                    success: true, 
                    message: 'Bot started',
                    botTag: announcementBot.user.tag,
                    guilds: guilds.map(g => ({
                        id: g.id,
                        name: g.name,
                        icon: g.iconURL(),
                        memberCount: g.memberCount
                    }))
                });
            } catch (err) {
                console.error('Error fetching guilds:', err);
                res.status(500).json({ success: false, message: err.message });
            }
        });

        announcementBot.on('error', console.error);

        await announcementBot.login(token);

    } catch (err) {
        console.error('Announcement bot error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/selfbot/start', async (req, res) => {
    try {
        const { token, channelIds, message, dmResponse } = req.body;

        if (selfBot) await selfBot.destroy();

        selfBot = new SelfClient({ checkUpdate: false });

        // Self bot configuration
        const CHANNEL_CONFIGS = {};
        channelIds.forEach(id => {
            CHANNEL_CONFIGS[id] = {
                interval: 10,
                message: message,
                lastCheck: 0
            };
        });

        const GLOBAL_CONFIG = {
            dmResponse: dmResponse,
            banPattern: /was (banned|muted)/i,
            checkMinutes: 3
        };

        const respondedUsers = new Set();

        async function checkChannel(channelId) {
            const config = CHANNEL_CONFIGS[channelId];
            if (!config) return;
            
            try {
                const channel = selfBot.channels.cache.get(channelId);
                if (!channel) return;
                
                const now = Date.now();
                const messages = await channel.messages.fetch({ limit: 50 });
                const recentMessages = messages.filter(msg => 
                    (now - msg.createdTimestamp) <= GLOBAL_CONFIG.checkMinutes * 60 * 1000
                );
                
                const hasBlocked = recentMessages.some(msg => 
                    GLOBAL_CONFIG.banPattern.test(msg.content) || (msg.embeds && msg.embeds.length > 0)
                );
                
                if (!hasBlocked) {
                    await channel.send(config.message);
                    console.log(`[${channelId}] Message sent`);
                }
            } catch (err) {
                console.error(`[${channelId}] Error:`, err.message);
            }
        }

        // DM response
        selfBot.on('messageCreate', async msg => {
            if (msg.channel.type === 'DM' && !msg.author.bot && !respondedUsers.has(msg.author.id)) {
                try {
                    await msg.author.send(GLOBAL_CONFIG.dmResponse);
                    respondedUsers.add(msg.author.id);
                    console.log(`DM replied to: ${msg.author.tag}`);
                } catch (err) {
                    console.error('DM send error:', err.message);
                }
            }
        });

        selfBot.on('ready', () => {
            console.log(`Self bot ready: ${selfBot.user.tag}`);
            res.json({ success: true, message: 'Self bot started', botTag: selfBot.user.tag });

            // Start channel checks
            setInterval(() => {
                Object.keys(CHANNEL_CONFIGS).forEach(channelId => checkChannel(channelId));
            }, 30 * 1000);
        });

        selfBot.on('error', console.error);

        await selfBot.login(token);

    } catch (err) {
        console.error('Self bot error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/:botType/stop', async (req, res) => {
    try {
        const { botType } = req.params;
        const bot = botType === 'announcement' ? announcementBot : selfBot;

        if (bot) {
            await bot.destroy();
            if (botType === 'announcement') announcementBot = null;
            if (botType === 'selfbot') selfBot = null;
            res.json({ success: true, message: 'Bot stopped' });
        } else {
            res.json({ success: false, message: 'Bot not running' });
        }
    } catch (err) {
        console.error('Stop error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});