const PACK_SIZE = 250;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY";

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
const materialCalcEl = document.getElementById('materialCalc');

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

  materialCalcEl.innerHTML =
    `Pólvoras: <strong>${totalPolvora}</strong><br>
     Cartuchos: <strong>${totalCartucho}</strong>`;
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

document.getElementById('registrarEncomenda')
  .addEventListener('click',()=>{
    document.getElementById('formEncomenda')
      .classList.toggle('hidden');
  });

document.getElementById('confirmarRegistro')
  .addEventListener('click',()=>{

  const nome = document.getElementById('nomeComprador').value || "Não informado";
  const membro = document.getElementById('membro').value || "Não informado";
  const situacao = document.getElementById('situacao').value;

  let resumoProdutos="";
  produtos.forEach(p=>{
    const qtd = Number(document.getElementById(`qtd-${p.id}`).value)||0;
    if(qtd>0){
      resumoProdutos += `• ${p.nome}: ${qtd}\n`;
    }
  });

  const mensagem = {
    content: "📦 **NOVA ENCOMENDA REGISTRADA**",
    embeds: [
      {
        color: 5763719,
        fields: [
          { name: "👤 Comprador", value: nome, inline: true },
          { name: "👮 Membro", value: membro, inline: true },
          { name: "📌 Situação", value: situacao, inline: false },
          { name: "🛒 Produtos", value: resumoProdutos || "Nenhum", inline: false },
          { name: "💰 Valor Final", value: `R$ ${totalComDescontoEl.textContent}`, inline: true },
          { name: "🧪 Materiais", value: materialCalcEl.innerText, inline: false }
        ]
      }
    ]
  };

  fetch(WEBHOOK_URL,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(mensagem)
  })
  .then(()=>{
    alert("Encomenda enviada pro Discord 🚀");
  })
  .catch(()=>{
    alert("Erro ao enviar webhook");
  });

});

renderTabela();
calcular();
