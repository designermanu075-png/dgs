const PACK_SIZE = 250;

const produtos = [
{ id:'pistola', nome:'Munição de Pistola', precoPack:32500 },
{ id:'sub', nome:'Munição de Sub/SMG', precoPack:55000 },
{ id:'fuzil', nome:'Munição de Fuzil', precoPack:85000 }
];

const linhas = document.getElementById('linhas');
const totalPacksEl = document.getElementById('totalPacks');
const totalSemDescontoEl = document.getElementById('totalSemDesconto');
const descontoAplicadoEl = document.getElementById('descontoAplicado');
const totalComDescontoEl = document.getElementById('totalComDesconto');

let descontoAtual = 0;

const formatoBRL = v => v.toLocaleString('pt-BR',{minimumFractionDigits:2});

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
document.getElementById(`qtd-${p.id}`).addEventListener('input',calcular);
});
}

function calcular(){
let packsTotal=0;
let total=0;

produtos.forEach(p=>{
const qtd=Number(document.getElementById(`qtd-${p.id}`).value)||0;
const packs=Math.ceil(qtd/PACK_SIZE);
const subtotal=packs*p.precoPack;

packsTotal+=packs;
total+=subtotal;

document.getElementById(`packs-${p.id}`).textContent=packs;
document.getElementById(`subtotal-${p.id}`).textContent=`R$ ${formatoBRL(subtotal)}`;
});

const totalFinal=total*(1-descontoAtual/100);

totalPacksEl.textContent=packsTotal;
totalSemDescontoEl.textContent=formatoBRL(total);
descontoAplicadoEl.textContent=`${descontoAtual}%`;
totalComDescontoEl.textContent=formatoBRL(totalFinal);
}

document.querySelectorAll('.tab[data-desconto]').forEach(btn=>{
btn.addEventListener('click',()=>{
descontoAtual=Number(btn.dataset.desconto);
document.querySelectorAll('.tab[data-desconto]').forEach(t=>t.classList.remove('active'));
btn.classList.add('active');
calcular();
});
});

document.getElementById('limparOrcamento').addEventListener('click',()=>{
produtos.forEach(p=>document.getElementById(`qtd-${p.id}`).value=0);
descontoAtual=0;
calcular();
});

document.getElementById('registrarEncomenda').addEventListener('click',()=>{
document.getElementById('formEncomenda').classList.toggle('hidden');
atualizarMaterial();
});

function atualizarMaterial(){
let polvora=0;
let cartucho=0;

produtos.forEach(p=>{
const qtd=Number(document.getElementById(`qtd-${p.id}`).value)||0;
const packs=Math.ceil(qtd/PACK_SIZE);

if(p.id==='pistola') polvora+=packs*65;
if(p.id==='sub') polvora+=packs*85;
if(p.id==='fuzil') polvora+=packs*115;

cartucho+=packs*250;
});

document.getElementById('materialCalc').innerHTML=
`Pólvoras: <strong>${polvora}</strong><br>Cartuchos: <strong>${cartucho}</strong>`;
}

renderTabela();
calcular();
