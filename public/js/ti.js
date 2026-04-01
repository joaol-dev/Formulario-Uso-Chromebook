const PER_PAGE = 15;
let currentPage = 1;

async function getHistorico() {
  const res = await fetch('/historico', { cache: 'no-store' });

  if (res.status === 401) {
    window.location.href = '/login.html';
    throw new Error('Sessão expirada.');
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar histórico: ${res.status}`);
  }

  return await res.json();
}

function createBadgeMotivo(motivo) {
  const badge = document.createElement('span');
  badge.className = 'badge-motivo';

  if (!motivo || typeof motivo !== 'string') {
    badge.classList.add('outros');
    badge.textContent = 'Não informado';
    return badge;
  }

  const lower = motivo.toLowerCase();
  let cls = 'outros';

  if (lower.startsWith('estudo')) cls = 'estudo';
  else if (lower.startsWith('recreativo')) cls = 'recreativo';

  badge.classList.add(cls);
  badge.textContent = motivo;
  return badge;
}

function createStatCard(label, value, valueClass) {
  const card = document.createElement('div');
  card.className = 'stat-card';

  const labelEl = document.createElement('div');
  labelEl.className = 'stat-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('div');
  valueEl.className = `stat-value ${valueClass}`;
  valueEl.textContent = String(value);

  card.append(labelEl, valueEl);
  return card;
}

function createCell(text, className = '') {
  const td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text;
  return td;
}

function createRegistroRow(registro, index) {
  const tr = document.createElement('tr');

  tr.appendChild(createCell(String(index)));

  const professorTd = document.createElement('td');
  const professorStrong = document.createElement('strong');
  professorStrong.textContent = registro.professor || '-';
  professorTd.appendChild(professorStrong);
  tr.appendChild(professorTd);

  const turmaTd = document.createElement('td');
  const turmaBadge = document.createElement('span');
  turmaBadge.className = 'badge-turma';
  turmaBadge.textContent = registro.turma || '-';
  turmaTd.appendChild(turmaBadge);
  tr.appendChild(turmaTd);

  const motivoTd = document.createElement('td');
  motivoTd.appendChild(createBadgeMotivo(registro.motivo));
  tr.appendChild(motivoTd);

  tr.appendChild(createCell(registro.data || '-', 'datetime-cell'));
  tr.appendChild(createCell(registro.hora || '-', 'datetime-cell'));

  const actionTd = document.createElement('td');
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn-del';
  deleteButton.type = 'button';
  deleteButton.title = 'Remover';
  deleteButton.textContent = '×';
  deleteButton.addEventListener('click', () => deleteRow(registro.timestamp || ''));
  actionTd.appendChild(deleteButton);
  tr.appendChild(actionTd);

  return tr;
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

  stats.replaceChildren(
    createStatCard('Total de Registros', historico.length, 'blue'),
    createStatCard('Hoje', hoje, 'green'),
    createStatCard('Turmas', turmas, 'orange')
  );
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
    tbody.replaceChildren();
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    tbody.replaceChildren(...slice.map((r, i) => createRegistroRow(r, start + i + 1)));
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
  render().catch(err => console.error(err));
}

async function deleteRow(ts) {
  const timestamp = decodeURIComponent(ts);

  if (!confirm('Remover este registro?')) return;

  const res = await fetch(`/historico/${encodeURIComponent(timestamp)}`, {
    method: 'DELETE'
  });

  if (res.status === 401) {
    window.location.href = '/login.html';
    return;
  }

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

  if (res.status === 401) {
    window.location.href = '/login.html';
    return;
  }

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

async function logout() {
  try {
    await fetch('/logout', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Erro ao sair do painel:', error);
  } finally {
    window.location.href = '/login.html';
  }
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
