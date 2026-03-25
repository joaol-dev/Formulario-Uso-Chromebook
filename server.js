const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'historico.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadHistorico() {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
}

function saveHistorico(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

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

app.post('/registrar', (req, res) => {
    const { professor, turma, motivo } = req.body;

    if (!professor || !turma || !motivo) {
        return res.status(400).json({
            error: 'Campos obrigatórios: professor, turma e motivo.'
        });
    }

    const historico = loadHistorico();
    const { data, hora, timestamp } = getDateTimeParts();

    const registro = {
        professor,
        turma,
        motivo,
        data,
        hora,
        timestamp
    };

    historico.unshift(registro);
    saveHistorico(historico);

    res.status(201).json(registro);
});

app.get('/historico', (req, res) => {
    res.json(loadHistorico());
});

app.delete('/historico/:timestamp', (req, res) => {
    let historico = loadHistorico();
    const tamanhoAntes = historico.length;

    historico = historico.filter(r => r.timestamp !== req.params.timestamp);

    if (historico.length === tamanhoAntes) {
        return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    saveHistorico(historico);
    res.json({ ok: true });
});

app.delete('/historico', (req, res) => {
    saveHistorico([]);
    res.json({ ok: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});