require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Bot instances
let announcementBot = null;
let selfBot = null;

// API Routes
app.post('/api/announcement/start', async (req, res) => {
    try {
        const { token, message, servers, sendTo, delay } = req.body;

        if (announcementBot) {
            try {
                await announcementBot.destroy();
            } catch (err) {
                console.error('Error destroying previous bot:', err);
            }
        }

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
                const selectedGuilds = announcementBot.guilds.cache.filter(g => servers.includes(g.id));
                const guildsData = selectedGuilds.map(g => ({
                    id: g.id,
                    name: g.name,
                    icon: g.iconURL(),
                    memberCount: g.memberCount
                }));

                res.json({ 
                    success: true, 
                    message: 'Bot started successfully',
                    botTag: announcementBot.user.tag,
                    guilds: guildsData
                });
            } catch (err) {
                console.error('Error in ready handler:', err);
                res.status(500).json({ success: false, message: 'Error initializing bot' });
            }
        });

        announcementBot.on('error', err => {
            console.error('Bot error:', err);
            res.status(500).json({ success: false, message: 'Bot encountered an error' });
        });

        await announcementBot.login(token)
            .catch(err => {
                console.error('Login error:', err);
                res.status(401).json({ success: false, message: 'Invalid token' });
            });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Diğer endpoint'ler aynı şekilde düzenlenmeli...

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something broke!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
