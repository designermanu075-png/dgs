const PACK_SIZE = 250;
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbwn7l8c38TohLme2CH7yTEoUmGT2hp4jeh4oOqV-09YKxRc4WsUQGSQ9Vqk5_T6Zc3CRQ/exec"; // <--- COLE A URL AQUI

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

const imgDGS = "https://cdn.discordapp.com/attachments/1191888158795771934/1474355625847685224/NO_DINHEIRO_SUJO_30_4.png?ex=69998c2d&is=69983aad&hm=f02638f1272fabdcc06ca6580ab76e5e8ce3c9580d8ec0535dcb2faaef703c31&";

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

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
    let packsTotal = 0; let totalGeral = 0; let qtdMuniTotal = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subtotal = packs * p.precoPack;
        qtdMuniTotal += qtd; packsTotal += packs; totalGeral += subtotal;
        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = `R$ ${formatoBRL(subtotal)}`;
    });
    const totalFinal = totalGeral * (1 - descontoAtual / 100);
    const porcComissao = qtdMuniTotal > 2000 ? 0.10 : 0.05;
    const valorComissao = totalFinal * porcComissao;

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

document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const btn = document.getElementById('confirmarRegistro');
    btn.disabled = true; btn.innerText = "⏳ Gravando Dados...";

    const situacao = document.getElementById('situacao').value;
    let nomesMuni = []; let quantidadesMuni = []; let qtdTotal = 0;
    
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (qtd > 0) {
            qtdTotal += qtd;
            nomesMuni.push(p.nome.replace("Munição de ", ""));
            quantidadesMuni.push(qtd + " un.");
        }
    });

    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        total: document.getElementById('totalComDesconto').innerText,
        comissao: document.getElementById('comissaoValor').innerText,
        desconto: document.getElementById('descontoAplicado').innerText,
        materiais: document.getElementById('materialCalc').innerText,
        produtos: nomesMuni.join(", "),
        qtdMuni: quantidadesMuni.join(" | ")
    };

    try {
        const response = await fetch(URL_CONTADOR_GLOBAL, { method: 'POST', body: JSON.stringify(dados) });
        const numID = await response.text();
        const numPedido = "#" + numID.padStart(4, '0');

        const embedEncomenda = {
            title: `📋 REGISTRO DE ENCOMENDA ${numPedido}`,
            color: 1752220,
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: `R$ ${dados.total}`, inline: true },
                { name: "💸 Comissão", value: dados.comissao, inline: true },
                { name: "Quantidade de munições*", value: `**${qtdTotal}**`, inline: true },
                { name: "Tipo de Munição", value: `**${dados.produtos}**`, inline: true },
                { name: "🚦 Status", value: situacao, inline: false },
                { name: "📦 Materiais**", value: dados.materiais, inline: false }
            ],
            image: { url: imgDGS },
            timestamp: new Date()
        };

        await fetch(webhooks.encomenda, { 
            method: 'POST', headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ content: `# **Olá <@1474353140148207687> temos uma nova encomenda!**`, embeds: [embedEncomenda] }) 
        });

        if (situacao.includes('✅')) {
            await dispararLogsFinais(numPedido, dados, situacao);
        }

        alert(`✅ Pedido ${numPedido} registrado!`);
        btn.disabled = false; btn.innerText = "Finalizar e Enviar";
    } catch (e) {
        alert("❌ Erro de conexão com a planilha.");
        btn.disabled = false;
    }
}

document.getElementById('btnUpdateStatus').addEventListener('click', async () => {
    const idRaw = document.getElementById('updateNumPedido').value.replace('#', '').replace(/^0+/, '');
    const situ = document.getElementById('updateSituacao').value;
    const btn = document.getElementById('btnUpdateStatus');

    if (!idRaw) return alert("Digite o número do pedido!");
    btn.innerText = "🔍 Buscando dados...";

    try {
        const response = await fetch(`${URL_CONTADOR_GLOBAL}?id=${idRaw}`);
        const data = await response.json();

        if (data === "erro") {
            alert("❌ Pedido não encontrado!");
        } else if (situ.includes('✅')) {
            await dispararLogsFinais("#" + idRaw.padStart(4, '0'), data, situ);
            alert("✅ Status atualizado!");
        }
    } catch (e) {
        alert("❌ Erro ao buscar dados.");
    }
    btn.innerText = "Atualizar no Discord";
});

async function dispararLogsFinais(numPedido, dados, situacao) {
    const embedComissao = {
        title: `💸 COMISSÃO GERADA ${numPedido}`,
        color: 3066993,
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "💰 Total Venda", value: `**R$ ${dados.total}**`, inline: true },
            { name: "💸 Comissão", value: `**R$ ${dados.comissao}**`, inline: true },
            { name: "📉 Desconto", value: dados.desconto, inline: true },
            { name: "🚦 Status", value: situacao, inline: true }
        ]
    };

    const embedRegistro = {
        title: `✅ VENDA REGISTRADA ${numPedido}`,
        color: 2067276,
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "📦 Produto", value: dados.produtos, inline: true },
            { name: "📊 Quantidade", value: dados.qtdMuni || "Consultar Encomenda", inline: true },
            { name: "💰 Total Venda", value: `**R$ ${dados.total}**`, inline: true },
            { name: "📉 Desconto", value: dados.desconto, inline: true },
            { name: "🚦 Status", value: situacao, inline: false }
        ]
    };

    await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedComissao] }) });
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedRegistro] }) });
}

document.getElementById('btnAbrirForm').addEventListener('click', () => {
    document.getElementById('formUpdate').classList.add('hidden');
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

document.getElementById('btnToggleUpdate').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.toggle('hidden');
});

const parcerias = {
    0: "⚠️ Atenção: Não vender para pessoal de pista ou CPF munições de calibre maior que pistola.",
    20: "🤝 Parcerias 20%: Medellin, Cartel, Egito",
    30: "🤝 Parcerias 30%: Tropa da Russia, Golden"
};

document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const infoEl = document.getElementById('info-parceria');
        infoEl.textContent = parcerias[descontoAtual] || "";
        infoEl.className = `info-parceria ${descontoAtual === 0 ? 'alerta-venda' : 'info-venda'}`;
        calcular();
    });
});

document.getElementById('limparOrcamento').addEventListener('click', () => {
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).value = 0);
    descontoAtual = 0;
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.add('hidden');
    calcular();
});

renderTabela(); calcular();