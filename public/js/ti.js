const PER_PAGE = 15;
let currentPage = 1;

async function getHistorico() {
  const res = await fetch('/historico');
  if (!res.ok) throw new Error('Erro ao buscar histórico');
  return await res.json();
}

function badgeMotivo(m) {
  const lower = m.toLowerCase();
  let cls = 'outros';

  if (lower.startsWith('estudo')) cls = 'estudo';
  else if (lower.startsWith('recreativo')) cls = 'recreativo';

  return `<span class="badge-motivo ${cls}">${m}</span>`;
}

async function populateDateFilter() {
  const h = await getHistorico();
  const dates = [...new Set(h.map(r => r.data))];

  const sel = document.getElementById('f-data');
  const cur = sel.value;

  sel.innerHTML = '<option value="">Todas as datas</option>';

  dates.forEach(d => {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    if (d === cur) o.selected = true;
    sel.appendChild(o);
  });
}

async function getFiltered() {
  let h = await getHistorico();

  const fProf = document.getElementById('f-professor').value.trim().toLowerCase();
  const fTurma = document.getElementById('f-turma').value;
  const fMotivo = document.getElementById('f-motivo').value;
  const fData = document.getElementById('f-data').value;

  if (fProf) h = h.filter(r => r.professor.toLowerCase().includes(fProf));
  if (fTurma) h = h.filter(r => r.turma === fTurma);
  if (fMotivo) h = h.filter(r => r.motivo.startsWith(fMotivo));
  if (fData) h = h.filter(r => r.data === fData);

  return h;
}

async function renderStats() {
  const h = await getHistorico();
  const today = new Date().toLocaleDateString('pt-BR');

  const hoje = h.filter(r => r.data === today).length;
  const turmas = new Set(h.map(r => r.turma)).size;

  document.getElementById('stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value blue">${h.length}</div></div>
    <div class="stat-card"><div class="stat-label">Hoje</div><div class="stat-value green">${hoje}</div></div>
    <div class="stat-card"><div class="stat-label">Turmas</div><div class="stat-value orange">${turmas}</div></div>
  `;
}

async function render() {
  const filtered = await getFiltered();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (currentPage > totalPages) currentPage = 1;

  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const tbody = document.getElementById('tbody');
  const emptyEl = document.getElementById('empty-state');

  if (slice.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';

    tbody.innerHTML = slice.map((r, i) => `
      <tr>
        <td>${(currentPage - 1) * PER_PAGE + i + 1}</td>
        <td><strong>${r.professor}</strong></td>
        <td><span class="badge-turma">${r.turma}</span></td>
        <td>${badgeMotivo(r.motivo)}</td>
        <td>${r.data}</td>
        <td>${r.hora}</td>
        <td>
          <button class="btn-del" onclick="deleteRow('${r.timestamp}')">✕</button>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('pagination').innerHTML = `${total} registro(s)`;
}

function goPage(p) {
  currentPage = p;
  render();
}

async function deleteRow(ts) {
  if (!confirm('Remover este registro?')) return;

  await fetch(`/historico/${encodeURIComponent(ts)}`, {
    method: 'DELETE'
  });

  await populateDateFilter();
  await renderStats();
  await render();
}

async function confirmClear() {
  if (!confirm('Apagar tudo?')) return;

  await fetch('/historico', { method: 'DELETE' });

  currentPage = 1;

  await populateDateFilter();
  await renderStats();
  await render();
}

async function exportCSV() {
  const h = await getFiltered();

  if (!h.length) return alert('Sem dados');

  const csv = h.map(r =>
    `"${r.professor}","${r.turma}","${r.motivo}","${r.data}","${r.hora}"`
  ).join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'historico.csv';
  a.click();
}

(async function init() {
  try {
    await populateDateFilter();
    await renderStats();
    await render();
  } catch (err) {
    console.error(err);
    alert('Servidor não está rodando');
  }
})();