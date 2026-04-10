const OPCAO_AUXILIAR = 'AUX_TI';

/*
  Base por dia:
  - usada sempre
  - se não houver grade detalhada por horário para o momento atual,
    o sistema cai automaticamente nessa base do dia.
*/
const gradePorDia = {
  1: [ // segunda
    { professor: 'Milena', turmas: ['Turma 600', 'Turma 601', 'Turma 610'] },
    { professor: 'Daniel', turmas: ['Turma 601', 'Turma 700', 'Turma 701','Turma 800', 'Turma 710'] },
    { professor: 'Maria', turmas: ['Turma 700', 'Turma 701'] },
    { professor: 'Cristiane', turmas: ['Turma 701', 'Turma 800', 'Turma 810'] },
    { professor: 'João', turmas: ['Turma 800', 'Turma 801', 'Turma 611'] },
    { professor: 'Vitor', turmas: ['Turma 801', 'Turma 901', 'Turma 610'] },
    { professor: 'Gabriel', turmas: ['Turma 900', 'Turma 901'] },
    { professor: 'Sirley', turmas: ['Turma 800', 'Turma 801', 'Turma 900', 'Turma 910'] },
    { professor: 'Hudson', turmas: ['Turma 611', 'Turma 810'] },
    { professor: 'Ricardo', turmas: ['Turma 910'] },
    { professor: 'Jardelina', turmas: ['Turma 710'] }
  ],
  2: [ // terça
    { professor: 'Milena', turmas: ['Turma 600', 'Turma 601', 'Turma 700'] },
    { professor: 'Maria', turmas: ['Turma 600', 'Turma 601'] },
    { professor: 'Renato', turmas: ['Turma 700', 'Turma 701', 'Turma 801'] },
    { professor: 'Daniel', turmas: ['Turma 700', 'Turma 701'] },
    { professor: 'Layon', turmas: ['Turma 800', 'Turma 801', 'Turma 901'] },
    { professor: 'Cristiane', turmas: ['Turma 800', 'Turma 801', 'Turma 900', 'Turma 901'] },
    { professor: 'Bruna', turmas: ['Turma 900', 'Turma 901'] },
    { professor: 'Gabriel', turmas: ['Turma 900', 'Turma 901', 'Turma 710'] },
    { professor: 'Fabio', turmas: ['Turma 610', 'Turma 710', 'Turma 910'] },
    { professor: 'Livia', turmas: ['Turma 611', 'Turma 810'] },
    { professor: 'Cláudio', turmas: ['Turma 810', 'Turma 910'] },
    { professor: 'Hellen', turmas: ['Turma 611', 'Turma 710'] },
    { professor: 'Jardelina', turmas: ['Turma 610', 'Turma 810'] }
  ],
  3: [ // quarta
    { professor: 'Maria', turmas: ['Turma 600', 'Turma 601', 'Turma 701'] },
    { professor: 'Jhone', turmas: ['Turma 600', 'Turma 601'] },
    { professor: 'Ricardo', turmas: ['Turma 700'] },
    { professor: 'Sirley', turmas: ['Turma 701'] },
    { professor: 'Layon', turmas: ['Turma 800', 'Turma 801', 'Turma 900', 'Turma 901'] },
    { professor: 'Renato', turmas: ['Turma 700', 'Turma 701', 'Turma 800'] },
    { professor: 'Paula', turmas: ['Turma 900', 'Turma 901'] },
    { professor: 'Neilton', turmas: ['Turma 800', 'Turma 801', 'Turma 810', 'Turma 910'] },
    { professor: 'Emmerson', turmas: ['Turma 610', 'Turma 710'] },
    { professor: 'Hudson', turmas: ['Turma 611', 'Turma 810'] },
    { professor: 'Vinicius', turmas: ['Turma 710'] },
    { professor: 'Angela', turmas: ['Turma 601'] },
    { professor: 'Hellen', turmas: ['Turma 910'] },
    { professor: 'Jardelina', turmas: ['Turma 610', 'Turma 710'] }
  ],
  4: [ // quinta
    { professor: 'Luciano', turmas: ['Turma 600', 'Turma 700'] },
    { professor: 'Beatriz', turmas: ['Turma 601', 'Turma 700', 'Turma 810', 'Turma 910'] },
    { professor: 'Sirley', turmas: ['Turma 700', 'Turma 701'] },
    { professor: 'Carlos', turmas: ['Turma 701', 'Turma 800', 'Turma 810'] },
    { professor: 'Bruna', turmas: ['Turma 800', 'Turma 900'] },
    { professor: 'Emmerson', turmas: ['Turma 801', 'Turma 710'] },
    { professor: 'Fabio', turmas: ['Turma 900', 'Turma 901', 'Turma 710', 'Turma 910'] },
    { professor: 'Enelicio', turmas: ['Turma 901', 'Turma 800', 'Turma 810'] },
    { professor: 'Livia', turmas: ['Turma 611'] },
    { professor: 'Eliana', turmas: ['Turma 710'] },
    { professor: 'Neilton', turmas: ['Turma 910'] },
    { professor: 'Ricardo', turmas: ['Turma 600', 'Turma 601'] },
    { professor: 'Jardelina', turmas: ['Turma 610'] }
  ],
  5: [ // sexta
    { professor: 'Cláudio', turmas: ['Turma 600', 'Turma 601', 'Turma 910'] },
    { professor: 'Cristiana', turmas: ['Turma 601', 'Turma 701'] },
    { professor: 'Ricardo', turmas: ['Turma 700'] },
    { professor: 'Emmerson', turmas: ['Turma 600', 'Turma 701', 'Turma 900'] },
    { professor: 'Carlos', turmas: ['Turma 701', 'Turma 800', 'Turma 810'] },
    { professor: 'João', turmas: ['Turma 800', 'Turma 801', 'Turma 710'] },
    { professor: 'Vitor', turmas: ['Turma 900', 'Turma 901', 'Turma 610'] },
    { professor: 'Enelicio', turmas: ['Turma 901', 'Turma 800'] },
    { professor: 'Gabriel', turmas: ['Turma 611', 'Turma 910'] },
    { professor: 'Eliana', turmas: ['Turma 710', 'Turma 810'] },
    { professor: 'Bruna', turmas: ['Turma 901'] },
    { professor: 'Sirley', turmas: ['Turma 611'] }
  ]
};

/*
  Grade detalhada por horário:
  - se o horário atual cair em uma faixa abaixo, o sistema usa esse bloco
  - se não cair, usa gradePorDia
  - você pode expandir isso depois sem mexer no restante do código
*/
const gradePorDiaHorario = {
  1: [ // segunda
    {
      inicio: '07:20',
      fim: '08:10',
      professores: [
        { professor: 'Milena', turmas: ['Turma 600', 'Turma 601'] },
        { professor: 'Daniel', turmas: ['Turma 700'] },
        { professor: 'Maria', turmas: ['Turma 701'] },
        { professor: 'João', turmas: ['Turma 800'] },
        { professor: 'Vitor', turmas: ['Turma 801'] },
        { professor: 'Gabriel', turmas: ['Turma 900'] },
        { professor: 'Sirley', turmas: ['Turma 901'] }
      ]
    },
    {
      inicio: '18:30',
      fim: '19:15',
      professores: [
        { professor: 'Milena', turmas: ['Turma 610'] },
        { professor: 'Hudson', turmas: ['Turma 611'] },
        { professor: 'Daniel', turmas: ['Turma 710'] },
        { professor: 'Cristiane', turmas: ['Turma 810'] },
        { professor: 'Ricardo', turmas: ['Turma 910'] }
      ]
    }
  ],
  2: [],
  3: [],
  4: [],
  5: []
};

const todasTurmas = [
  'Turma 600', 'Turma 601', 'Turma 700', 'Turma 701',
  'Turma 800', 'Turma 801', 'Turma 900', 'Turma 901',
  'Turma 610', 'Turma 611', 'Turma 710', 'Turma 810', 'Turma 910'
];

function updateTime() {
  const now = new Date();
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const d = dias[now.getDay()];
  const data = now.toLocaleDateString('pt-BR');
  const hora = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const el = document.getElementById('datetime');
  if (el) {
    el.textContent = `${d}, ${data} — ${hora}`;
  }
}

function horaParaMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function agoraEmMinutos() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getDiaAtual() {
  return new Date().getDay();
}

function getGradeDoMomento() {
  const dia = getDiaAtual();

  // domingo e sábado: sem grade
  if (dia === 0 || dia === 6) {
    return [];
  }

  const agora = agoraEmMinutos();
  const blocos = gradePorDiaHorario[dia] || [];

  const blocoAtual = blocos.find(bloco => {
    const inicio = horaParaMinutos(bloco.inicio);
    const fim = horaParaMinutos(bloco.fim);
    return agora >= inicio && agora < fim;
  });

  if (blocoAtual && blocoAtual.professores && blocoAtual.professores.length > 0) {
    return blocoAtual.professores;
  }

  return gradePorDia[dia] || [];
}

function getNomeProfessorSelecionado() {
  const professorSelecionado = document.getElementById('sel-professor').value;

  if (professorSelecionado === OPCAO_AUXILIAR) {
    return sanitizeProfessorName(document.getElementById('txt-auxiliar').value);
  }

  return sanitizeProfessorName(professorSelecionado);
}

function sanitizeProfessorName(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');

  return normalized.replace(/^["']+|["']+$/g, '');
}

function getTipoResponsavelSelecionado() {
  const professorSelecionado = document.getElementById('sel-professor').value;
  return professorSelecionado === OPCAO_AUXILIAR ? 'Aux/TI' : 'Professor';
}

function carregarProfessoresDoMomento() {
  const selProfessor = document.getElementById('sel-professor');
  const selTurma = document.getElementById('sel-turma');
  const campoAuxiliar = document.getElementById('campo-auxiliar');
  const txtAuxiliar = document.getElementById('txt-auxiliar');

  const gradeAtual = getGradeDoMomento();

  selProfessor.innerHTML = '<option value="">Selecione o professor…</option>';
  selTurma.innerHTML = '<option value="">Selecione a turma…</option>';

  const nomesUnicos = [...new Set(gradeAtual.map(item => item.professor))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  nomesUnicos.forEach(nome => {
    const option = document.createElement('option');
    option.value = nome;
    option.textContent = nome;
    selProfessor.appendChild(option);
  });

  const optionAux = document.createElement('option');
  optionAux.value = OPCAO_AUXILIAR;
  optionAux.textContent = 'Aux. de disciplina / TI';
  selProfessor.appendChild(optionAux);

  if (campoAuxiliar) campoAuxiliar.style.display = 'none';
  if (txtAuxiliar) txtAuxiliar.value = '';

  validate();
}

function carregarTurmasDoProfessor() {
  const professorSelecionado = document.getElementById('sel-professor').value;
  const selTurma = document.getElementById('sel-turma');
  const campoAuxiliar = document.getElementById('campo-auxiliar');

  selTurma.innerHTML = '<option value="">Selecione a turma…</option>';

  if (!professorSelecionado) {
    if (campoAuxiliar) campoAuxiliar.style.display = 'none';
    validate();
    return;
  }

  if (professorSelecionado === OPCAO_AUXILIAR) {
    if (campoAuxiliar) campoAuxiliar.style.display = 'block';

    todasTurmas.forEach(turma => {
      const option = document.createElement('option');
      option.value = turma;
      option.textContent = turma;
      selTurma.appendChild(option);
    });

    validate();
    return;
  }

  if (campoAuxiliar) campoAuxiliar.style.display = 'none';

  const gradeAtual = getGradeDoMomento();
  const dadosProfessor = gradeAtual.find(item => item.professor === professorSelecionado);

  if (dadosProfessor) {
    [...new Set(dadosProfessor.turmas)].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(turma => {
      const option = document.createElement('option');
      option.value = turma;
      option.textContent = turma;
      selTurma.appendChild(option);
    });
  }

  validate();
}

function validate() {
  const professorSelecionado = document.getElementById('sel-professor').value;
  const turma = document.getElementById('sel-turma').value;
  const motivo = document.querySelector('input[name="motivo"]:checked');
  const btn = document.getElementById('btn-confirmar');
  const txtAuxiliar = document.getElementById('txt-auxiliar');

  let professorValido = !!professorSelecionado;

  if (professorSelecionado === OPCAO_AUXILIAR) {
    professorValido = !!txtAuxiliar && txtAuxiliar.value.trim() !== '';
  }

  btn.disabled = !(professorValido && turma && motivo);
}

function resetForm() {
  document.getElementById('success-overlay').classList.remove('show');
  document.getElementById('sel-professor').value = '';
  document.getElementById('sel-turma').innerHTML = '<option value="">Selecione a turma…</option>';
  document.querySelectorAll('input[name="motivo"]').forEach(r => {
    r.checked = false;
  });

  const outrosTexto = document.getElementById('outros-texto');
  if (outrosTexto) outrosTexto.classList.remove('visible');

  const txtOutros = document.getElementById('txt-outros');
  if (txtOutros) txtOutros.value = '';

  const campoAuxiliar = document.getElementById('campo-auxiliar');
  if (campoAuxiliar) campoAuxiliar.style.display = 'none';

  const txtAuxiliar = document.getElementById('txt-auxiliar');
  if (txtAuxiliar) txtAuxiliar.value = '';

  carregarProfessoresDoMomento();
  document.getElementById('btn-confirmar').disabled = true;
}

async function registrarUso() {
  const btn = document.getElementById('btn-confirmar');
  const professor = getNomeProfessorSelecionado();
  const tipoResponsavel = getTipoResponsavelSelecionado();
  const turma = document.getElementById('sel-turma').value;
  const motivoEl = document.querySelector('input[name="motivo"]:checked');

  if (!professor || !turma || !motivoEl) {
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
        professor,
        tipoResponsavel,
        turma,
        motivo
      })
    });

    if (!res.ok) {
      throw new Error('Erro ao salvar registro');
    }

    const registro = await res.json();

    const successDetail = document.getElementById('success-detail');
    const professorStrong = document.createElement('strong');
    const turmaStrong = document.createElement('strong');

    professorStrong.textContent = registro.professor;
    turmaStrong.textContent = registro.turma;

    successDetail.replaceChildren(
      document.createTextNode(`${registro.tipoResponsavel || tipoResponsavel}: `),
      professorStrong,
      document.createTextNode(' registrou uso para '),
      turmaStrong,
      document.createElement('br'),
      document.createTextNode(`Motivo: ${registro.motivo}`),
      document.createElement('br'),
      document.createElement('br'),
      document.createTextNode(`${registro.data} às ${registro.hora}`)
    );

    document.getElementById('success-overlay').classList.add('show');
  } catch (error) {
    console.error(error);
    alert('Não foi possível registrar o uso. Verifique se o servidor está online.');
  } finally {
    btn.innerHTML = '<i data-lucide="check" class="btn-icon"></i><span>Confirmar uso</span>';
    lucide.createIcons();
    validate();
  }
}

updateTime();
setInterval(updateTime, 30000);

// Atualiza professores do momento a cada minuto
setInterval(() => {
  const professorSelecionado = document.getElementById('sel-professor').value;
  const nomeAuxiliar = document.getElementById('txt-auxiliar') ? document.getElementById('txt-auxiliar').value : '';
  const turmaSelecionada = document.getElementById('sel-turma').value;

  carregarProfessoresDoMomento();

  if (professorSelecionado) {
    document.getElementById('sel-professor').value = professorSelecionado;

    if (professorSelecionado === OPCAO_AUXILIAR && document.getElementById('txt-auxiliar')) {
      document.getElementById('txt-auxiliar').value = nomeAuxiliar;
    }

    carregarTurmasDoProfessor();

    if (turmaSelecionada) {
      document.getElementById('sel-turma').value = turmaSelecionada;
    }

    validate();
  }
}, 60000);

// Mostrar/ocultar campo "Outros"
document.querySelectorAll('input[name="motivo"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const el = document.getElementById('outros-texto');
    const motivoSelecionado = document.querySelector('input[name="motivo"]:checked');

    if (motivoSelecionado && motivoSelecionado.value === 'Outros') {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }

    validate();
  });
});

document.getElementById('sel-professor').addEventListener('change', carregarTurmasDoProfessor);
document.getElementById('sel-turma').addEventListener('change', validate);
document.getElementById('txt-outros').addEventListener('input', validate);

const txtAuxiliar = document.getElementById('txt-auxiliar');
if (txtAuxiliar) {
  txtAuxiliar.addEventListener('input', validate);
}

document.getElementById('btn-confirmar').addEventListener('click', registrarUso);

const btnNovoRegistro = document.getElementById('btn-novo-registro');
if (btnNovoRegistro) {
  btnNovoRegistro.addEventListener('click', resetForm);
}

// Inicialização
carregarProfessoresDoMomento();
validate();
