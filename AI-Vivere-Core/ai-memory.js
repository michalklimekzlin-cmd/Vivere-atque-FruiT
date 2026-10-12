<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="AI Vivere atque FruiT - Osobní AI asistentka na iPhone 14">
    <meta name="theme-color" content="#0a0e1f">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect fill='%230a0e1f' width='180' height='180'/><text x='90' y='100' font-size='60' fill='%23ffd700' text-anchor='middle' dominant-baseline='middle' font-family='Arial'>🤖</text></svg>">
    <title>AI Vivere Core</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0e1f 0%, #1a1a2e 100%);
            color: #e0e0e0;
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: rgba(20, 25, 40, 0.9);
            padding: 1.5rem;
            border-bottom: 2px solid #ffd700;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #ffd700;
        }

        .status {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            font-size: 0.9rem;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff00;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .container {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
        }

        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .message {
            padding: 1rem;
            border-radius: 12px;
            max-width: 90%;
            word-wrap: break-word;
        }

        .message.user {
            align-self: flex-end;
            background: #1e40af;
            color: #fff;
            border-bottom-right-radius: 4px;
        }

        .message.ai {
            align-self: flex-start;
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid #ffd700;
            color: #ffd700;
            border-bottom-left-radius: 4px;
        }

        .input-area {
            padding: 1.5rem;
            background: rgba(20, 25, 40, 0.9);
            border-top: 2px solid #ffd700;
            display: flex;
            gap: 0.5rem;
        }

        input {
            flex: 1;
            padding: 0.75rem 1rem;
            background: #1a1a2e;
            border: 1px solid #ffd700;
            color: #fff;
            border-radius: 8px;
            font-size: 1rem;
        }

        input::placeholder {
            color: #666;
        }

        button {
            padding: 0.75rem 1.5rem;
            background: #ffd700;
            color: #0a0e1f;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }

        button:hover {
            background: #ffed4e;
            transform: translateY(-2px);
        }

        button:active {
            transform: translateY(0);
        }

        .controls {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            padding: 1rem;
            background: rgba(20, 25, 40, 0.8);
            border-top: 1px solid #333;
            flex-wrap: wrap;
        }

        .control-btn {
            padding: 0.5rem 1rem;
            background: rgba(255, 215, 0, 0.2);
            border: 1px solid #ffd700;
            color: #ffd700;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.3s;
        }

        .control-btn:hover {
            background: rgba(255, 215, 0, 0.4);
        }

        .audit-badge {
            padding: 0.25rem 0.75rem;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            color: #00ff00;
            border-radius: 4px;
            font-size: 0.75rem;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🤖 AI Vivere Core</div>
        <div class="status">
            <div class="status-dot"></div>
            <span id="status-text">Načítám...</span>
        </div>
    </div>

    <div class="container">
        <div class="chat-container" id="chat-container"></div>
    </div>

    <div class="controls">
        <button class="control-btn" onclick="showAuditLog()">📋 Audit Log</button>
        <button class="control-btn" onclick="showAgents()">👥 Agenti</button>
        <button class="control-btn" onclick="rotateApiKey()">🔑 Rotace Klíče</button>
        <button class="control-btn" onclick="clearMemory()">🗑️ Vyčistit</button>
    </div>

    <div class="input-area">
        <input type="text" id="message-input" placeholder="Napiš zprávu AI..." />
        <button onclick="sendMessage()">Poslat</button>
    </div>

    <script src="ai-memory.js"></script>
    <script src="ai-agents.js"></script>
    <script src="ai-core.js"></script>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
        }
    </script>
</body>
</html>
