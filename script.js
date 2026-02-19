const PACK_SIZE = 250;

const produtos = [
  { id:'pistola', nome:'Munição de Pistola', precoPack:32500, polvora:65 },
  { id:'sub', nome:'Munição de Sub/SMG', precoPack:55000, polvora:85 },
  { id:'fuzil', nome:'Munição de Fuzil', precoPack:85000, polvora:115 }
];

const linhas = document.getElementById('linhas');
const totalPacksEl = document.getElementById('totalPacks');
const totalSemDescontoEl = document.getElementById('totalSemDesconto');
const descontoAplicadoEl = document.getElementById('descontoAplicado');
const totalComDescontoEl = document.getElementById('totalComDesconto');
const totalPolvoraEl = document.getElementById('totalPolvora');
const totalCartuchoEl = document.getElementById('totalCartucho');

let descontoAtual = 0;

const formatoBRL = v =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function renderTabela(){
  linhas.innerHTML = produtos.map(p=>`
  <tr>
    <td>${p.nome}</td>
    <td>R$ ${formatoBRL(p.precoPack)}</td>
    <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0"></td>
    <td id="packs-${p.id}">0</td>
    <td id="subtotal-${p.id}">R$ 0,00</td>
  </tr>
  `).join('');

  produtos.forEach(p=>{
    document.getElementById(`qtd-${p.id}`)
      .addEventListener('input',calcular);
  });
}

function calcular(){
  let packsTotal=0;
  let total=0;
  let totalPolvora=0;
  let totalCartucho=0;

  produtos.forEach(p=>{
    const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
    const packs = Math.ceil(qtd / PACK_SIZE);
    const subtotal = packs * p.precoPack;

    packsTotal += packs;
    total += subtotal;

    totalPolvora += packs * p.polvora;
    totalCartucho += packs * 250;

    document.getElementById(`packs-${p.id}`).textContent = packs;
    document.getElementById(`subtotal-${p.id}`)
      .textContent = `R$ ${formatoBRL(subtotal)}`;
  });

  const totalFinal = total * (1 - descontoAtual/100);

  totalPacksEl.textContent = packsTotal;
  totalSemDescontoEl.textContent = formatoBRL(total);
  descontoAplicadoEl.textContent = `${descontoAtual}%`;
  totalComDescontoEl.textContent = formatoBRL(totalFinal);

  totalPolvoraEl.textContent = totalPolvora;
  totalCartuchoEl.textContent = totalCartucho;
}

document.querySelectorAll('.tab[data-desconto]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    descontoAtual = Number(btn.dataset.desconto);
    document.querySelectorAll('.tab[data-desconto]')
      .forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    calcular();
  });
});

document.getElementById('limparOrcamento')
  .addEventListener('click',()=>{
    produtos.forEach(p=>{
      document.getElementById(`qtd-${p.id}`).value=0;
    });
    descontoAtual=0;
    calcular();
  });

renderTabela();
calcular();
