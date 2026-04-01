async function login() {
  const passwordInput = document.getElementById('txt-password');
  const feedback = document.getElementById('login-feedback');
  const button = document.getElementById('btn-login');
  const password = passwordInput.value.trim();

  if (!password) {
    feedback.classList.add('error');
    feedback.textContent = 'Digite a senha para continuar.';
    return;
  }

  try {
    button.disabled = true;
    button.textContent = 'Entrando...';
    feedback.classList.remove('error');
    feedback.textContent = '';

    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      feedback.classList.add('error');
      feedback.textContent = 'Senha inválida. Tente novamente.';
      return;
    }

    window.location.href = '/ti.html';
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    feedback.classList.add('error');
    feedback.textContent = 'Não foi possível entrar agora. Tente novamente.';
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar no painel';
  }
}

document.getElementById('btn-login').addEventListener('click', login);
document.getElementById('txt-password').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    login();
  }
});

document.getElementById('btn-toggle-password').addEventListener('click', () => {
  const passwordInput = document.getElementById('txt-password');
  const toggleButton = document.getElementById('btn-toggle-password');
  const isHidden = passwordInput.type === 'password';

  passwordInput.type = isHidden ? 'text' : 'password';
  toggleButton.textContent = isHidden ? 'Ocultar' : 'Mostrar';
});
