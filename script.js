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

async function registrarEncomenda() {
    const webhookURL = "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY";

    // Capturando os dados dos inputs e textos da tela
    const dados = {
        comprador: document.getElementById('inputComprador')?.value || "Não informado",
        membro: document.getElementById('inputMembro')?.value || "Não informado",
        situacao: document.getElementById('selectSituacao')?.value || "Em andamento",
        
        // Valores de Munição (Quantidade pedida)
        pistola: document.getElementById('qtdPistola')?.value || "0",
        smg: document.getElementById('qtdSmg')?.value || "0",
        fuzil: document.getElementById('qtdFuzil')?.value || "0",

        // Totais e Materiais
        totalPacks: document.getElementById('totalPacks')?.innerText || "0",
        totalFinal: document.getElementById('totalFinal')?.innerText || "R$ 0,00",
        polvoras: document.getElementById('totalPolvoras')?.innerText || "0",
        cartuchos: document.getElementById('totalCartuchos')?.innerText || "0"
    };

    // Montando o corpo da mensagem para o Discord
    const corpoMensagem = {
        username: "Sistema de Orçamentos",
        avatar_url: "https://i.imgur.com/4M34hi2.png", // Opcional: ícone do bot
        embeds: [{
            title: "📦 NOVA ENCOMENDA REGISTRADA",
            color: 5763719, // Verde
            fields: [
                { name: "👤 Comprador / FAC", value: `\`${dados.comprador}\``, inline: true },
                { name: "🛠️ Membro Responsável", value: `\`${dados.membro}\``, inline: true },
                { name: "🚦 Situação", value: dados.situacao, inline: true },
                
                { name: "━━━━━━━━━━━━━━━━━━━━━━━━", value: "**DETALHES DO PEDIDO**", inline: false },
                { name: "🔫 Munição Pistola", value: `${dados.pistola} un.`, inline: true },
                { name: "🔫 Munição Sub/SMG", value: `${dados.smg} un.`, inline: true },
                { name: "🔫 Munição Fuzil", value: `${dados.fuzil} un.`, inline: true },
                
                { name: "━━━━━━━━━━━━━━━━━━━━━━━━", value: "**RESUMO E MATERIAIS**", inline: false },
                { name: "📦 Total de Packs", value: dados.totalPacks, inline: true },
                { name: "💰 Valor Final", value: `**${dados.totalFinal}**`, inline: true },
                { name: "📦 Pólvoras: " + dados.polvoras, value: "🐚 Cartuchos: " + dados.cartuchos, inline: false }
            ],
            footer: { text: "Gerado em: " + new Date().toLocaleString('pt-BR') },
            thumbnail: { url: "https://i.imgur.com/AfFp7pu.png" } // Opcional: imagem de munição
        }]
    };

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpoMensagem)
        });

        if (response.ok) {
            alert("✅ Encomenda enviada para o Discord!");
        } else {
            alert("❌ Erro ao enviar encomenda.");
        }
    } catch (error) {
        console.error("Erro na conexão:", error);
        alert("❌ Erro de rede ao tentar conectar ao Discord.");
    }
}