function updateTime() {
  const now = new Date();
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const d = dias[now.getDay()];
  const data = now.toLocaleDateString('pt-BR');
  const hora = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  document.getElementById('datetime').textContent = `${d}, ${data} — ${hora}`;
}

updateTime();
setInterval(updateTime, 30000);

document.querySelectorAll('input[name="motivo"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const outrosEl = document.getElementById('outros-texto');
    const motivoSelecionado = document.querySelector('input[name="motivo"]:checked');

    if (motivoSelecionado && motivoSelecionado.value === 'Outros') {
      outrosEl.classList.add('visible');
    } else {
      outrosEl.classList.remove('visible');
    }

    validate();
  });
});

function validate() {
  const prof = document.getElementById('sel-professor').value;
  const turma = document.getElementById('sel-turma').value;
  const motivo = document.querySelector('input[name="motivo"]:checked');
  const btn = document.getElementById('btn-confirmar');

  btn.disabled = !(prof && turma && motivo);
}

document.getElementById('sel-professor').addEventListener('change', validate);
document.getElementById('sel-turma').addEventListener('change', validate);
document.getElementById('txt-outros').addEventListener('input', validate);

document.getElementById('btn-confirmar').addEventListener('click', async () => {
  const btn = document.getElementById('btn-confirmar');
  const prof = document.getElementById('sel-professor').value;
  const turma = document.getElementById('sel-turma').value;
  const motivoEl = document.querySelector('input[name="motivo"]:checked');

  if (!prof || !turma || !motivoEl) {
    return;
  }

  let motivo = motivoEl.value;

  if (motivo === 'Outros') {
    const txt = document.getElementById('txt-outros').value.trim();
    motivo = txt ? `Outros: ${txt}` : 'Outros';
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const res = await fetch('/registrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        professor: prof,
        turma: turma,
        motivo: motivo
      })
    });

    if (!res.ok) {
      throw new Error('Erro ao salvar registro');
    }

    const registro = await res.json();

    document.getElementById('success-detail').innerHTML =
      `<strong>${registro.professor}</strong> registrou uso para <strong>${registro.turma}</strong><br>Motivo: ${registro.motivo}<br><br>${registro.data} às ${registro.hora}`;

    document.getElementById('success-overlay').classList.add('show');
  } catch (error) {
    console.error(error);
    alert('Não foi possível registrar o uso. Verifique se o servidor está online.');
  } finally {
    btn.textContent = '✓ Confirmar Uso';
    validate();
  }
});

function resetForm() {
  document.getElementById('success-overlay').classList.remove('show');
  document.getElementById('sel-professor').value = '';
  document.getElementById('sel-turma').value = '';
  document.querySelectorAll('input[name="motivo"]').forEach(r => {
    r.checked = false;
  });
  document.getElementById('outros-texto').classList.remove('visible');
  document.getElementById('txt-outros').value = '';
  document.getElementById('btn-confirmar').disabled = true;
}

const btnNovoRegistro = document.getElementById('btn-novo-registro');
if (btnNovoRegistro) {
  btnNovoRegistro.addEventListener('click', resetForm);
}