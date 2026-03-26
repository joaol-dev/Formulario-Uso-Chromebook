const PER_PAGE = 15;
let currentPage = 1;

async function getHistorico() {
  const res = await fetch('/historico');

  if (!res.ok) {
    throw new Error(`Erro ao buscar histórico: ${res.status}`);
  }

  return await res.json();
}

function badgeMotivo(motivo) {
  if (!motivo || typeof motivo !== 'string') {
    return '<span class="badge-motivo outros">Não informado</span>';
  }

  const lower = motivo.toLowerCase();
  let cls = 'outros';

  if (lower.startsWith('estudo')) cls = 'estudo';
  else if (lower.startsWith('recreativo')) cls = 'recreativo';

  return `<span class="badge-motivo ${cls}">${motivo}</span>`;
}

async function populateDateFilter() {
  const historico = await getHistorico();
  const dates = [...new Set(historico.map(r => r.data).filter(Boolean))];

  const sel = document.getElementById('f-data');
  if (!sel) return;

  const cur = sel.value;
  sel.innerHTML = '<option value="">Todas as datas</option>';

  dates.forEach(d => {
    const option = document.createElement('option');
    option.value = d;
    option.textContent = d;
    if (d === cur) option.selected = true;
    sel.appendChild(option);
  });
}

async function getFiltered() {
  let historico = await getHistorico();

  const fProf = document.getElementById('f-professor')?.value.trim().toLowerCase() || '';
  const fTurma = document.getElementById('f-turma')?.value || '';
  const fMotivo = document.getElementById('f-motivo')?.value || '';
  const fData = document.getElementById('f-data')?.value || '';

  if (fProf) {
    historico = historico.filter(r =>
      (r.professor || '').toLowerCase().includes(fProf)
    );
  }

  if (fTurma) {
    historico = historico.filter(r => r.turma === fTurma);
  }

  if (fMotivo) {
    historico = historico.filter(r => (r.motivo || '').startsWith(fMotivo));
  }

  if (fData) {
    historico = historico.filter(r => r.data === fData);
  }

  return historico;
}

async function renderStats() {
  const historico = await getHistorico();
  const today = new Date().toLocaleDateString('pt-BR');

  const hoje = historico.filter(r => r.data === today).length;
  const turmas = new Set(historico.map(r => r.turma).filter(Boolean)).size;

  const stats = document.getElementById('stats');
  if (!stats) return;

  stats.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total de Registros</div>
      <div class="stat-value blue">${historico.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Hoje</div>
      <div class="stat-value green">${hoje}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Turmas</div>
      <div class="stat-value orange">${turmas}</div>
    </div>
  `;
}

async function render() {
  const filtered = await getFiltered();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (currentPage > totalPages) currentPage = 1;

  const start = (currentPage - 1) * PER_PAGE;
  const end = currentPage * PER_PAGE;
  const slice = filtered.slice(start, end);

  const tbody = document.getElementById('tbody');
  const emptyEl = document.getElementById('empty-state');
  const pag = document.getElementById('pagination');

  if (!tbody || !emptyEl || !pag) {
    throw new Error('Elementos do painel não encontrados no HTML.');
  }

  if (slice.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';

    tbody.innerHTML = slice.map((r, i) => `
      <tr>
        <td>${start + i + 1}</td>
        <td><strong>${r.professor || '-'}</strong></td>
        <td><span class="badge-turma">${r.turma || '-'}</span></td>
        <td>${badgeMotivo(r.motivo)}</td>
        <td class="datetime-cell">${r.data || '-'}</td>
        <td class="datetime-cell">${r.hora || '-'}</td>
        <td>
          <button class="btn-del" onclick="deleteRow('${encodeURIComponent(r.timestamp || '')}')" title="Remover">
            ✕
          </button>
        </td>
      </tr>
    `).join('');
  }

  if (totalPages <= 1) {
    pag.innerHTML = `<span>${total} registro(s)</span>`;
    return;
  }

  let btns = '';
  for (let p = 1; p <= totalPages; p++) {
    btns += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
  }

  pag.innerHTML = `
    <span>${total} registro(s) · Página ${currentPage} de ${totalPages}</span>
    <div class="page-btns">
      <button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
      ${btns}
      <button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
    </div>
  `;
}

function goPage(page) {
  currentPage = page;
  render().catch(err => {
    console.error('Erro ao mudar página:', err);
  });
}

async function deleteRow(ts) {
  const timestamp = decodeURIComponent(ts);

  if (!confirm('Remover este registro?')) return;

  const res = await fetch(`/historico/${encodeURIComponent(timestamp)}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    alert('Não foi possível remover o registro.');
    return;
  }

  await populateDateFilter();
  await renderStats();
  await render();
}

async function confirmClear() {
  if (!confirm('Tem certeza que deseja apagar TODO o histórico?')) return;

  const res = await fetch('/historico', {
    method: 'DELETE'
  });

  if (!res.ok) {
    alert('Não foi possível limpar o histórico.');
    return;
  }

  currentPage = 1;
  await populateDateFilter();
  await renderStats();
  await render();
}

async function exportCSV() {
  const historico = await getFiltered();

  if (!historico.length) {
    alert('Nenhum registro para exportar.');
    return;
  }

  const header = ['Professor', 'Turma', 'Motivo', 'Data', 'Hora'];
  const rows = historico.map(r => [
    r.professor || '',
    r.turma || '',
    r.motivo || '',
    r.data || '',
    r.hora || ''
  ]);

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `historico_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  a.click();
}

async function init() {
  try {
    await populateDateFilter();
    await renderStats();
    await render();
  } catch (error) {
    console.error('Erro ao inicializar painel TI:', error);
    alert('Não foi possível carregar os registros agora. Atualize a página em alguns segundos.');
  }
}

init();