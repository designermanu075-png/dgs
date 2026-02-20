const PACK_SIZE = 250;
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbyaDGOmSRZibwYW9jZvWtmk4qHh4XmHx9hqr3W34s3S4I-0lpn4wLW40WhrYZRRthV5/exec";

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

const parcerias = {
    0: "⚠️ Atenção: Não vender para pessoal de pista ou CPF munições de calibre maior que pistola.",
    20: "🤝 Parcerias 20%: Medellin, Cartel, Egito",
    30: "🤝 Parcerias 30%: Tropa da Russia, Golden"
};

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// --- LÓGICA DE CÁLCULO ---
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

// --- LOGICA DE REGISTRO ---
document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const btn = document.getElementById('confirmarRegistro');
    btn.disabled = true; btn.innerText = "⏳ Gravando Dados...";

    const situacao = document.getElementById('situacao').value;
    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        total: document.getElementById('totalComDesconto').innerText,
        comissao: document.getElementById('comissaoValor').innerText,
        desconto: document.getElementById('descontoAplicado').innerText,
        materiais: document.getElementById('materialCalc').innerText,
        produtos: Array.from(document.querySelectorAll('.input-table'))
                        .filter(i => i.value > 0)
                        .map(i => i.id.replace('qtd-','') + ": " + i.value)
                        .join(", ")
    };

    try {
        const response = await fetch(URL_CONTADOR_GLOBAL, { method: 'POST', body: JSON.stringify(dados) });
        const numID = await response.text();
        const numPedido = "#" + numID.padStart(4, '0');

        const embedEncomenda = {
            title: `📦 REGISTRO DE ENCOMENDA ${numPedido}`,
            color: 1752220,
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: `R$ ${dados.total}`, inline: true },
                { name: "💸 Comissão", value: dados.comissao, inline: true },
                { name: "🚦 Status", value: situacao, inline: false },
                { name: "📦 Materiais**", value: dados.materiais, inline: false }
            ],
            image: { url: "https://i.imgur.com/V9rP8L7.png" }, // Link direto da imagem (image_d36963.png)
            timestamp: new Date()
        };

        await fetch(webhooks.encomenda, { 
            method: 'POST', headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ content: `# **Olá <@1474353140148207687> temos uma nova encomenda!**`, embeds: [embedEncomenda] }) 
        });

        if (situacao.includes('✅')) {
            await dispararLogsFinais(numPedido, dados, situacao);
        }

        alert(`✅ Pedido ${numPedido} registrado com sucesso!`);
        btn.disabled = false; btn.innerText = "Finalizar e Enviar";
    } catch (e) {
        alert("❌ Erro ao salvar dados na planilha. Verifique se o Script Google está publicado corretamente.");
        btn.disabled = false;
    }
}

// --- LOGICA DE ATUALIZAÇÃO (image_d36963.png) ---
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
            alert("❌ Pedido não encontrado na planilha!");
        } else if (situ.includes('✅')) {
            await dispararLogsFinais("#" + idRaw.padStart(4, '0'), data, situ);
            alert("✅ Status atualizado e logs financeiros enviados!");
        } else {
            alert("Status 'Falta entregar' não gera logs de comissão.");
        }
    } catch (e) {
        alert("❌ Erro de conexão com a planilha.");
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
            { name: "📦 Produto", value: dados.produtos.split(': ')[0], inline: true },
            { name: "📊 Quantidade", value: dados.produtos.split(': ')[1] || "---", inline: true },
            { name: "💰 Total Venda", value: `**R$ ${dados.total}**`, inline: true },
            { name: "📉 Desconto", value: dados.desconto, inline: true },
            { name: "🚦 Status", value: situacao, inline: false }
        ]
    };

    await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedComissao] }) });
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedRegistro] }) });
}

// --- INTERFACE ---
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const infoEl = document.getElementById('info-parceria');
        infoEl.textContent = parcerias[descontoAtual];
        infoEl.className = `info-parceria ${descontoAtual === 0 ? 'alerta-venda' : 'info-venda'}`;
        calcular();
    });
});

document.getElementById('btnAbrirForm').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

document.getElementById('limparOrcamento').addEventListener('click', () => {
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).value = 0);
    descontoAtual = 0;
    document.getElementById('formEncomenda').classList.add('hidden');
    calcular();
});

renderTabela(); calcular();
document.getElementById('info-parceria').textContent = parcerias[0];
document.getElementById('info-parceria').className = "info-parceria alerta-venda";