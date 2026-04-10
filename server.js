require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs/promises');
const ExcelJS = require('exceljs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE_NAME = 'ti_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const FALLBACK_DB_PATH = path.join(__dirname, 'data', 'registros.json');
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

async function ensureFallbackDb() {
    await fs.mkdir(path.dirname(FALLBACK_DB_PATH), { recursive: true });

    try {
        await fs.access(FALLBACK_DB_PATH);
    } catch {
        await fs.writeFile(FALLBACK_DB_PATH, '[]', 'utf8');
    }
}

async function readFallbackRegistros() {
    await ensureFallbackDb();

    const content = await fs.readFile(FALLBACK_DB_PATH, 'utf8');

    try {
        const registros = JSON.parse(content);
        return Array.isArray(registros) ? registros : [];
    } catch {
        return [];
    }
}

async function writeFallbackRegistros(registros) {
    await ensureFallbackDb();
    await fs.writeFile(FALLBACK_DB_PATH, JSON.stringify(registros, null, 2), 'utf8');
}

function sortRegistrosByTimestampDesc(registros) {
    return [...registros].sort((a, b) => {
        const aTime = Date.parse(a.timestamp) || 0;
        const bTime = Date.parse(b.timestamp) || 0;
        return bTime - aTime;
    });
}

function normalizeRegistro(row) {
    return {
        professor: row.professor,
        tipoResponsavel: row.tipo_responsavel || row.tipoResponsavel || 'Professor',
        turma: row.turma,
        motivo: row.motivo,
        data: row.data,
        hora: row.hora,
        timestamp: row.timestamp
    };
}

function sanitizeProfessorName(value) {
    const normalized = String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^["']+|["']+$/g, '');

    return normalized;
}

async function buildWorkbookBuffer(registros) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historico', {
        views: [{ state: 'frozen', ySplit: 3 }]
    });

    workbook.creator = 'Formulario Uso Chromebook';
    workbook.created = new Date();

    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Historico de Uso dos Chromebooks';
    titleCell.font = {
        name: 'Calibri',
        size: 16,
        bold: true,
        color: { argb: 'FFFFFFFF' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' }
    };
    worksheet.getRow(1).height = 24;

    worksheet.mergeCells('A2:F2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Gerado em ${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    })}`;
    subtitleCell.font = {
        name: 'Calibri',
        size: 10,
        italic: true,
        color: { argb: 'FF4A5568' }
    };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 18;

    worksheet.columns = [
        { key: 'tipoResponsavel', width: 14 },
        { key: 'professor', width: 28 },
        { key: 'turma', width: 16 },
        { key: 'motivo', width: 20 },
        { key: 'data', width: 14 },
        { key: 'hora', width: 10 }
    ];

    const headerRow = worksheet.getRow(3);
    headerRow.values = ['Tipo', 'Responsável', 'Turma', 'Motivo', 'Data', 'Hora'];
    headerRow.height = 20;

    headerRow.eachCell(cell => {
        cell.font = {
            name: 'Calibri',
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2B6CB0' }
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFB7C0CE' } },
            left: { style: 'thin', color: { argb: 'FFB7C0CE' } },
            bottom: { style: 'thin', color: { argb: 'FFB7C0CE' } },
            right: { style: 'thin', color: { argb: 'FFB7C0CE' } }
        };
    });

    registros.forEach((registro, index) => {
        const row = worksheet.addRow({
            tipoResponsavel: registro.tipoResponsavel || 'Professor',
            professor: registro.professor || '',
            turma: registro.turma || '',
            motivo: registro.motivo || '',
            data: registro.data || '',
            hora: registro.hora || ''
        });

        const isEvenRow = index % 2 === 0;

        row.eachCell(cell => {
            cell.alignment = { vertical: 'middle' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };

            if (isEvenRow) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF7FAFC' }
                };
            }
        });

        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    worksheet.autoFilter = {
        from: 'A3',
        to: 'F3'
    };

    return workbook.xlsx.writeBuffer();
}

function isDatabaseConfigured() {
    return !!process.env.DATABASE_URL;
}

function isDatabaseUnavailable(error) {
    return Boolean(
        error &&
        typeof error === 'object' &&
        ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01'].includes(error.code)
    );
}

async function insertRegistro(registro) {
    if (!isDatabaseConfigured()) {
        const registros = await readFallbackRegistros();
        registros.push(registro);
        await writeFallbackRegistros(registros);
        return { registro, storage: 'arquivo' };
    }

    try {
        const query = `
      INSERT INTO registros (professor, tipo_responsavel, turma, motivo, data, hora, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING professor, tipo_responsavel, turma, motivo, data, hora, timestamp
    `;

        const values = [
            registro.professor,
            registro.tipoResponsavel,
            registro.turma,
            registro.motivo,
            registro.data,
            registro.hora,
            registro.timestamp
        ];

        const result = await pool.query(query, values);
        return { registro: normalizeRegistro(result.rows[0]), storage: 'postgres' };
    } catch (error) {
        if (error.code === '23505') {
            throw new Error('Já existe um registro com este identificador.');
        }

        if (!isDatabaseUnavailable(error)) {
            throw error;
        }

        console.warn('PostgreSQL indisponível. Salvando registro no arquivo local.', error.message);

        const registros = await readFallbackRegistros();
        registros.push(registro);
        await writeFallbackRegistros(registros);
        return { registro, storage: 'arquivo' };
    }
}

async function listRegistros() {
    const fallbackRegistros = (await readFallbackRegistros()).map(normalizeRegistro);

    if (!isDatabaseConfigured()) {
        return sortRegistrosByTimestampDesc(fallbackRegistros);
    }

    try {
        const result = await pool.query(`
      SELECT professor, tipo_responsavel, turma, motivo, data, hora, timestamp
      FROM registros
      ORDER BY timestamp DESC
    `);

        const registros = result.rows.map(normalizeRegistro);
        const merged = new Map();

        [...fallbackRegistros, ...registros].forEach(registro => {
            merged.set(registro.timestamp, registro);
        });

        return sortRegistrosByTimestampDesc([...merged.values()]);
    } catch (error) {
        if (!isDatabaseUnavailable(error)) {
            throw error;
        }

        console.warn('PostgreSQL indisponível. Lendo histórico do arquivo local.', error.message);
        return sortRegistrosByTimestampDesc(fallbackRegistros);
    }
}

async function deleteRegistro(timestamp) {
    const fallbackRegistros = await readFallbackRegistros();
    const nextFallbackRegistros = fallbackRegistros.filter(registro => registro.timestamp !== timestamp);
    const removedFromFallback = nextFallbackRegistros.length !== fallbackRegistros.length;

    if (removedFromFallback) {
        await writeFallbackRegistros(nextFallbackRegistros);
    }

    if (!isDatabaseConfigured()) {
        return removedFromFallback;
    }

    try {
        const result = await pool.query(
            'DELETE FROM registros WHERE timestamp = $1',
            [timestamp]
        );

        return removedFromFallback || result.rowCount > 0;
    } catch (error) {
        if (!isDatabaseUnavailable(error)) {
            throw error;
        }

        console.warn('PostgreSQL indisponível. Remoção feita apenas no arquivo local.', error.message);
        return removedFromFallback;
    }
}

async function clearRegistros() {
    await writeFallbackRegistros([]);

    if (!isDatabaseConfigured()) {
        return;
    }

    try {
        await pool.query('DELETE FROM registros');
    } catch (error) {
        if (!isDatabaseUnavailable(error)) {
            throw error;
        }

        console.warn('PostgreSQL indisponível. Histórico limpo apenas no arquivo local.', error.message);
    }
}

async function initDb() {
    await ensureFallbackDb();

    if (!isDatabaseConfigured()) {
        console.warn('DATABASE_URL não definida. Usando armazenamento em arquivo local.');
        return;
    }

    await pool.query(`
    CREATE TABLE IF NOT EXISTS registros (
      id SERIAL PRIMARY KEY,
      professor TEXT NOT NULL,
      tipo_responsavel TEXT NOT NULL DEFAULT 'Professor',
      turma TEXT NOT NULL,
      motivo TEXT NOT NULL,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      timestamp TEXT NOT NULL UNIQUE
    )
  `);

    await pool.query(`
    ALTER TABLE registros
    ADD COLUMN IF NOT EXISTS tipo_responsavel TEXT NOT NULL DEFAULT 'Professor'
  `);
}

app.post('/registrar', async (req, res) => {
    try {
        const { professor, turma, motivo, tipoResponsavel } = req.body || {};
        const sanitizedProfessor = sanitizeProfessorName(professor);
        const normalizedTipoResponsavel = tipoResponsavel === 'Aux/TI' ? 'Aux/TI' : 'Professor';

        if (!sanitizedProfessor || !turma || !motivo) {
            return res.status(400).json({
                error: 'Campos obrigatórios: professor, turma e motivo.'
            });
        }

        const { data, hora, timestamp } = getDateTimeParts();
        const { registro, storage } = await insertRegistro({
            professor: sanitizedProfessor,
            tipoResponsavel: normalizedTipoResponsavel,
            turma,
            motivo,
            data,
            hora,
            timestamp
        });

        res.status(201).json({ ...registro, storage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Erro ao salvar registro.' });
    }
});

app.get('/historico', requireAuth, async (req, res) => {
    try {
        const registros = await listRegistros();
        res.json(registros);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
});

app.post('/historico/export.xlsx', requireAuth, async (req, res) => {
    try {
        const { registros } = req.body || {};

        if (!Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({ error: 'Nenhum registro para exportar.' });
        }

        const workbookBuffer = await buildWorkbookBuffer(registros);
        const dateLabel = new Date().toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        }).replace(/\//g, '-');

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="historico_${dateLabel}.xlsx"`
        );

        return res.send(workbookBuffer);
    } catch (error) {
        console.error('Erro ao exportar planilha XLSX:', error);
        return res.status(500).json({ error: 'NÃ£o foi possÃ­vel exportar a planilha.' });
    }
});

app.delete('/historico/:timestamp', requireAuth, async (req, res) => {
    try {
        const removed = await deleteRegistro(req.params.timestamp);

        if (!removed) {
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
        await clearRegistros();
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
