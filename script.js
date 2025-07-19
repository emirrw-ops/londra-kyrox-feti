// Bot seçim butonları
document.querySelectorAll('.bot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bot-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.bot-section').forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.bot}-bot`).classList.add('active');
    });
});

// Duyuru Botu Başlatma
document.getElementById('start-announcement').addEventListener('click', async () => {
    const token = document.getElementById('announcement-token').value.trim();
    const message = document.getElementById('announcement-message').value.trim();
    
    if (!token) {
        addLog('announcement', 'Hata: Token gerekli', 'error');
        return;
    }
    
    if (!message) {
        addLog('announcement', 'Hata: Mesaj gerekli', 'error');
        return;
    }
    
    try {
        document.getElementById('start-announcement').disabled = true;
        addLog('announcement', 'Bot başlatılıyor...');
        
        const response = await fetch('/api/announcement/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                message: message,
                servers: [], // Sunucular backend'den alınacak
                sendTo: document.querySelector('input[name="send-to"]:checked').value,
                delay: parseInt(document.getElementById('send-delay').value)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('announcement', true);
            addLog('announcement', `Bot hazır: ${data.botTag}`);
            document.getElementById('stop-announcement').disabled = false;
            
            // Sunucuları listele
            displayServers(data.guilds);
        } else {
            addLog('announcement', `Hata: ${data.message}`, 'error');
            document.getElementById('start-announcement').disabled = false;
        }
    } catch (err) {
        addLog('announcement', `Bağlantı hatası: ${err.message}`, 'error');
        document.getElementById('start-announcement').disabled = false;
    }
});

// Self Bot Başlatma
document.getElementById('start-self').addEventListener('click', async () => {
    const token = document.getElementById('self-token').value.trim();
    const channelIds = document.getElementById('channel-ids').value.trim().split('\n');
    const message = document.getElementById('self-message').value.trim();
    const dmResponse = document.getElementById('dm-response').value.trim();
    
    if (!token) {
        addLog('self', 'Hata: Token gerekli', 'error');
        return;
    }
    
    if (channelIds.length === 0) {
        addLog('self', 'Hata: En az bir kanal ID gerekli', 'error');
        return;
    }
    
    try {
        document.getElementById('start-self').disabled = true;
        addLog('self', 'Self bot başlatılıyor...');
        
        const response = await fetch('/api/selfbot/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                channelIds: channelIds,
                message: message,
                dmResponse: dmResponse
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('self', true);
            addLog('self', `Self bot hazır: ${data.botTag}`);
            document.getElementById('stop-self').disabled = false;
        } else {
            addLog('self', `Hata: ${data.message}`, 'error');
            document.getElementById('start-self').disabled = false;
        }
    } catch (err) {
        addLog('self', `Bağlantı hatası: ${err.message}`, 'error');
        document.getElementById('start-self').disabled = false;
    }
});

// Bot Durdurma
document.getElementById('stop-announcement').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/announcement/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('announcement', false);
            addLog('announcement', 'Bot durduruldu');
            document.getElementById('start-announcement').disabled = false;
            document.getElementById('stop-announcement').disabled = true;
        }
    } catch (err) {
        addLog('announcement', `Durdurma hatası: ${err.message}`, 'error');
    }
});

document.getElementById('stop-self').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/selfbot/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('self', false);
            addLog('self', 'Self bot durduruldu');
            document.getElementById('start-self').disabled = false;
            document.getElementById('stop-self').disabled = true;
        }
    } catch (err) {
        addLog('self', `Durdurma hatası: ${err.message}`, 'error');
    }
});

// Yardımcı Fonksiyonlar
function displayServers(guilds) {
    const container = document.getElementById('announcement-servers');
    container.innerHTML = '';
    
    guilds.forEach(guild => {
        const card = document.createElement('div');
        card.className = 'server-card';
        card.dataset.id = guild.id;
        
        card.innerHTML = `
            <div class="server-info">
                ${guild.icon ? 
                    `<img src="${guild.icon}" alt="${guild.name}" class="server-icon">` : 
                    `<div class="server-icon" style="background:#7289da;color:white;display:flex;align-items:center;justify-content:center;">
                        ${guild.name.charAt(0)}
                    </div>`
                }
                <div>
                    <h4>${guild.name}</h4>
                    <p>${guild.memberCount} üye</p>
                </div>
            </div>
            <div class="form-group">
                <input type="checkbox" id="server-${guild.id}" checked>
                <label for="server-${guild.id}">Seç</label>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    addLog('announcement', `${guilds.length} sunucu bulundu`);
}

function updateStatus(type, isOnline) {
    const statusElement = document.getElementById(`${type}-status`);
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('span:last-child');
    
    indicator.className = `status-indicator ${isOnline ? 'status-online' : 'status-offline'}`;
    text.textContent = isOnline ? 'Çalışıyor' : 'Kapalı';
}

function addLog(type, message, level = 'info') {
    const now = new Date();
    const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = timeStr;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = ' ' + message;
    
    if (level === 'error') {
        messageSpan.style.color = 'red';
    } else if (level === 'success') {
        messageSpan.style.color = 'green';
    }
    
    logEntry.appendChild(timeSpan);
    logEntry.appendChild(messageSpan);
    
    document.getElementById(`${type}-log`).prepend(logEntry);
}