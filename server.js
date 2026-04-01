const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());
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

app.get('/historico', async (req, res) => {
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

app.delete('/historico/:timestamp', async (req, res) => {
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

app.delete('/historico', async (req, res) => {
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
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao inicializar banco:', err);
        process.exit(1);
    });