// API base URL
const API_BASE_URL = window.location.origin;

// Duyuru Botu Başlatma (Düzeltilmiş)
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
        
        const response = await fetch(`${API_BASE_URL}/api/announcement/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                message: message,
                servers: [], // Sunucular backend'den alınacak
                sendTo: document.querySelector('input[name="send-to"]:checked').value,
                delay: parseInt(document.getElementById('send-delay').value) || 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Sunucu hatası');
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('announcement', true);
            addLog('announcement', `Bot hazır: ${data.botTag}`);
            document.getElementById('stop-announcement').disabled = false;
            
            // Sunucuları listele
            if (data.guilds && data.guilds.length > 0) {
                displayServers(data.guilds);
            }
        } else {
            throw new Error(data.message || 'Bilinmeyen hata');
        }
    } catch (err) {
        addLog('announcement', `Hata: ${err.message}`, 'error');
        document.getElementById('start-announcement').disabled = false;
    }
});

// Self Bot Başlatma (Düzeltilmiş)
document.getElementById('start-self').addEventListener('click', async () => {
    const token = document.getElementById('self-token').value.trim();
    const channelIds = document.getElementById('channel-ids').value.trim().split('\n').filter(id => id.trim());
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
        
        const response = await fetch(`${API_BASE_URL}/api/selfbot/start`, {
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Sunucu hatası');
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('self', true);
            addLog('self', `Self bot hazır: ${data.botTag}`);
            document.getElementById('stop-self').disabled = false;
        } else {
            throw new Error(data.message || 'Bilinmeyen hata');
        }
    } catch (err) {
        addLog('self', `Hata: ${err.message}`, 'error');
        document.getElementById('start-self').disabled = false;
    }
});

// Yardımcı fonksiyonlar aynı kalacak...
