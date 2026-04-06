require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE_NAME = 'ti_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const sessions = new Map();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

if (!ADMIN_PASSWORD) {
    console.error('Defina ADMIN_PASSWORD no arquivo .env antes de iniciar o servidor.');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

function parseCookies(req) {
    const header = req.headers.cookie;

    if (!header) {
        return {};
    }

    return header.split(';').reduce((cookies, item) => {
        const [name, ...rest] = item.trim().split('=');

        if (!name) {
            return cookies;
        }

        cookies[name] = decodeURIComponent(rest.join('='));
        return cookies;
    }, {});
}

function createSession() {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_DURATION_MS);
    return token;
}

function getSessionToken(req) {
    return parseCookies(req)[SESSION_COOKIE_NAME];
}

function isAuthenticated(req) {
    const token = getSessionToken(req);

    if (!token) {
        return false;
    }

    const expiresAt = sessions.get(token);
    if (!expiresAt) {
        return false;
    }

    if (expiresAt < Date.now()) {
        sessions.delete(token);
        return false;
    }

    sessions.set(token, Date.now() + SESSION_DURATION_MS);
    return true;
}

function setSessionCookie(res, token) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieParts = [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Strict',
        `Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`
    ];

    if (isProduction) {
        cookieParts.push('Secure');
    }

    res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearSessionCookie(res) {
    res.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`
    );
}

function requireAuth(req, res, next) {
    if (isAuthenticated(req)) {
        return next();
    }

    return res.status(401).json({ error: 'Sessão expirada ou não autenticada.' });
}

function requireAuthPage(req, res, next) {
    if (isAuthenticated(req)) {
        return next();
    }

    return res.redirect('/login.html');
}

app.get('/login', (req, res) => {
    res.redirect('/login.html');
});

app.get('/login.html', (req, res) => {
    if (isAuthenticated(req)) {
        return res.redirect('/ti.html');
    }

    return res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { password } = req.body || {};

    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha inválida.' });
    }

    const token = createSession();
    setSessionCookie(res, token);

    return res.json({ ok: true });
});

app.post('/logout', (req, res) => {
    const token = getSessionToken(req);

    if (token) {
        sessions.delete(token);
    }

    clearSessionCookie(res);
    res.json({ ok: true });
});

app.get('/ti.html', requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ti.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

function getDateTimeParts() {
    const now = new Date();

    return {
        data: now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        hora: now.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: now.toISOString()
    };
}

async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS registros (
      id SERIAL PRIMARY KEY,
      professor TEXT NOT NULL,
      turma TEXT NOT NULL,
      motivo TEXT NOT NULL,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      timestamp TEXT NOT NULL UNIQUE
    )
  `);
}

app.post('/registrar', async (req, res) => {
    try {
        const { professor, turma, motivo } = req.body;

        if (!professor || !turma || !motivo) {
            return res.status(400).json({
                error: 'Campos obrigatórios: professor, turma e motivo.'
            });
        }

        const { data, hora, timestamp } = getDateTimeParts();

        const query = `
      INSERT INTO registros (professor, turma, motivo, data, hora, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING professor, turma, motivo, data, hora, timestamp
    `;

        const values = [professor, turma, motivo, data, hora, timestamp];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar registro.' });
    }
});

app.get('/historico', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT professor, turma, motivo, data, hora, timestamp
      FROM registros
      ORDER BY timestamp DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
});

app.delete('/historico/:timestamp', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM registros WHERE timestamp = $1',
            [req.params.timestamp]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro não encontrado.' });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover registro.' });
    }
});

app.delete('/historico', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM registros');
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao limpar histórico.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb()
    .then(() => {
        startServer(PORT);
    })
    .catch(err => {
        console.error('Erro ao inicializar banco:', err);
        process.exit(1);
    });

function startServer(initialPort) {
    const normalizedPort = Number(initialPort) || 3000;
    const server = http.createServer(app);

    server.on('error', error => {
        if (error.code === 'EADDRINUSE') {
            const nextPort = normalizedPort + 1;
            console.warn(`Porta ${normalizedPort} em uso. Tentando porta ${nextPort}...`);
            startServer(nextPort);
            return;
        }

        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    });

    server.listen(normalizedPort, () => {
        console.log(`Servidor rodando em http://localhost:${normalizedPort}`);
    });
}
