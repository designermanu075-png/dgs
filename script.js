const PACK_SIZE = 250;
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbyR-v-AaJrCaXNFumF0uI1r0aZyyZvSrjzanJCQ9W8e0tHQOzXUn-e1Szl-QpO4FCQp/exec";

const produtos = [
    { id: 'pistola', nome: 'Munição de Pistola', precoPack: 32500 },
    { id: 'sub', nome: 'Munição de Sub/SMG', precoPack: 55000 },
    { id: 'fuzil', nome: 'Munição de Fuzil', precoPack: 85000 }
];

const webhooks = {
    encomenda: "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY",
    registroVenda: "https://discord.com/api/webhooks/1474150006968680498/s5JnM0R5dWVna84bW6uM7gw_UrcllxwG30FaQzjcZ1NsKg6KnzCa3i6UhrDxGspdW2HJ",
    comissao: "https://discord.com/api/webhooks/1474356194046120162/HOQyAtwa5jK9gvtzgVEVggUCgPSUwJr1HP-1PNfHhNqBr-eu2xpc-BK9myhemRCY0b6h"
};

// URL da Imagem DGS fornecida
const imgDGS = "https://cdn.discordapp.com/attachments/1191888158795771934/1474355625847685224/NO_DINHEIRO_SUJO_30_4.png?ex=69998c2d&is=69983aad&hm=f02638f1272fabdcc06ca6580ab76e5e8ce3c9580d8ec0535dcb2faaef703c31&";

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// FUNÇÃO PARA CRIAR AS "CAIXINHAS" INDIVIDUAIS (image_d5331f.png)
function gerarDetalhesProdutos() {
    let detalhes = "";
    let nomesMuni = [];
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (qtd > 0) {
            detalhes += `🔹 **${p.nome.replace("Munição de ", "")}:** ${qtd} un.\n`;
            nomesMuni.push(p.nome.replace("Munição de ", ""));
        }
    });
    return { string: detalhes, nomes: nomesMuni.join(", ") };
}

function renderTabela() {
    const tabelaCorpo = document.getElementById('linhas');
    tabelaCorpo.innerHTML = produtos.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td>
            <td>R$ ${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0" class="input-table"></td>
            <td><span id="packs-${p.id}">0</span></td>
            <td><span id="subtotal-${p.id}">R$ 0,00</span></td>
        </tr>
    `).join('');
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular));
}

function calcular() {
    let packsTotal = 0; let totalGeral = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subtotal = packs * p.precoPack;
        packsTotal += packs; totalGeral += subtotal;
        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = `R$ ${formatoBRL(subtotal)}`;
    });
    const totalFinal = totalGeral * (1 - descontoAtual / 100);
    const valorComissao = totalFinal * 0.10; // Exemplo 10%

    document.getElementById('totalPacks').textContent = packsTotal;
    document.getElementById('totalSemDesconto').textContent = `R$ ${formatoBRL(totalGeral)}`;
    document.getElementById('descontoAplicado').textContent = `${descontoAtual}%`;
    document.getElementById('totalComDesconto').textContent = `R$ ${formatoBRL(totalFinal)}`;
    document.getElementById('comissaoValor').textContent = `R$ ${formatoBRL(valorComissao)}`;
    
    atualizarMaterial();
}

function atualizarMaterial() {
    let polvora = 0; let cartucho = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        if (p.id === 'pistola') polvora += packs * 65;
        if (p.id === 'sub') polvora += packs * 85;
        if (p.id === 'fuzil') polvora += packs * 115;
        cartucho += packs * 250;
    });
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${polvora}</strong> | 🐚 Cartuchos: <strong>${cartucho}</strong>`;
}

// TOGGLE DOS FORMULÁRIOS
document.getElementById('btnAbrirForm').addEventListener('click', () => {
    document.getElementById('formUpdate').classList.add('hidden');
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

document.getElementById('btnToggleUpdate').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.toggle('hidden');
});

// REGISTRAR NO DISCORD
document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const btn = document.getElementById('confirmarRegistro');
    const detalhes = gerarDetalhesProdutos();
    if (!detalhes.string) return alert("Selecione pelo menos uma munição!");

    btn.disabled = true; btn.innerText = "⏳ Gravando Dados...";
    const situacao = document.getElementById('situacao').value;

    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        total: document.getElementById('totalComDesconto').innerText,
        comissao: document.getElementById('comissaoValor').innerText,
        desconto: document.getElementById('descontoAplicado').innerText,
        materiais: document.getElementById('materialCalc').innerText,
        produtos: detalhes.nomes,
        detalhes: detalhes.string
    };

    try {
        const response = await fetch(URL_CONTADOR_GLOBAL, { method: 'POST', body: JSON.stringify(dados) });
        const numID = await response.text();
        const numPedido = "#" + numID.padStart(4, '0');

        const embed = {
            title: `📋 REGISTRO DE ENCOMENDA ${numPedido}`,
            color: 1752220,
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: dados.total, inline: true },
                { name: "📦 Detalhes do Pedido", value: dados.detalhes, inline: false },
                { name: "🚦 Status", value: situacao, inline: true },
                { name: "🧨 Materiais", value: dados.materiais, inline: true }
            ],
            image: { url: imgDGS },
            timestamp: new Date()
        };

        await fetch(webhooks.encomenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embed] }) });

        if (situacao.includes('✅')) await dispararLogsFinais(numPedido, dados, situacao);

        alert(`✅ Pedido ${numPedido} enviado!`);
        location.reload();
    } catch (e) {
        alert("❌ Erro de conexão.");
        btn.disabled = false;
    }
}

// ATUALIZAR STATUS (image_d3610c.png)
document.getElementById('btnUpdateStatus').addEventListener('click', async () => {
    const idRaw = document.getElementById('updateNumPedido').value.replace('#', '').replace(/^0+/, '');
    const situ = document.getElementById('updateSituacao').value;
    const btn = document.getElementById('btnUpdateStatus');

    if (!idRaw) return alert("Digite o número do pedido!");
    btn.disabled = true; btn.innerText = "🔍 Buscando...";

    try {
        const response = await fetch(`${URL_CONTADOR_GLOBAL}?id=${idRaw}`);
        const data = await response.json();

        if (data === "erro") {
            alert("❌ Pedido não encontrado!");
        } else if (situ.includes('✅')) {
            await dispararLogsFinais("#" + idRaw.padStart(4, '0'), data, situ);
            alert("✅ Status atualizado e logs financeiros enviados!");
            location.reload();
        }
    } catch (e) {
        alert("❌ Erro ao buscar dados.");
    } finally {
        btn.disabled = false; btn.innerText = "Confirmar Atualização";
    }
});

async function dispararLogsFinais(numPedido, dados, situacao) {
    const embedVenda = {
        title: `✅ VENDA REGISTRADA ${numPedido}`,
        color: 3066993,
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "📦 Detalhes", value: dados.detalhes || dados.produtos, inline: false },
            { name: "💰 Total", value: dados.total, inline: true }
        ]
    };
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedVenda] }) });
}

renderTabela();