# Formulário de Uso de Chromebook

Sistema web para registro e acompanhamento do uso de Chromebooks na **Escola Municipalizada Paulo Luiz Barroso Oliveira**.

## Visão geral

O sistema foi criado para registrar o uso dos Chromebooks de forma simples e organizada, permitindo que professores, auxiliares de disciplina e equipe de TI façam registros, enquanto o setor técnico acompanha o histórico em um painel administrativo.

O projeto possui:

- tela de registro de uso
- painel TI para consulta e gestão dos registros
- backend em Node.js com Express
- banco de dados PostgreSQL
- deploy online no Render

---

## Funcionalidades

### Tela de registro
- seleção dinâmica de professor
- seleção de turma
- motivo do uso:
  - Estudo
  - Recreativo
  - Outros
- campo de texto para detalhar "Outros"
- opção para **Aux. de disciplina / TI**
- registro com data e hora
- interface responsiva

### Painel TI
- visualização de todos os registros
- filtro por professor
- filtro por turma
- filtro por motivo
- filtro por data
- contador de registros
- exportação em CSV
- exclusão individual de registros
- limpeza completa do histórico
- responsividade para celular

---

## Tecnologias utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express

### Banco de dados
- PostgreSQL

### Hospedagem
- Render

### Ícones
- Lucide Icons

---

## Estrutura do projeto

```bash
public/
  index.html
  ti.html
  favicon.png
  css/
    style.css
    ti.css
  js/
    script.js
    ti.js

server.js
package.json
README.md
