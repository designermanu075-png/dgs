const PACK_SIZE = 250;
// URL ATUALIZADA FORNECIDA
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbxAItxhKJpbXutZgnO_7W8KK7ABhsgn9rGAzF2E-QWYBjRCj614MXU-YDOLLKDQrtZXjQ/exec";

const produtos = [
    { id: 'pistola', nome: 'Munição de Pistola', precoPack: 32500, pol: 65, car: 250 },
    { id: 'sub', nome: 'Munição de Sub/SMG', precoPack: 55000, pol: 85, car: 250 },
    { id: 'fuzil', nome: 'Munição de Fuzil', precoPack: 85000, pol: 115, car: 250 }
];

const webhooks = {
    encomenda: "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY",
    registroVenda: "https://discord.com/api/webhooks/1474150006968680498/s5JnM0R5dWVna84bW6uM7gw_UrcllxwG30FaQzjcZ1NsKg6KnzCa3i6UhrDxGspdW2HJ",
    comissao: "https://discord.com/api/webhooks/1474356194046120162/HOQyAtwa5jK9gvtzgVEVggUCgPSUwJr1HP-1PNfHhNqBr-eu2xpc-BK9myhemRCY0b6h"
};

const parcerias = {
    0: "⚠️ Atenção: Não vender calibres maiores que pistola para CPF.",
    20: "🤝 Parcerias 20%: Medellin, Cartel, Egito",
    30: "🤝 Parcerias 30%: Tropa da Russia, Golden"
};

const imgDGS = "https://cdn.discordapp.com/attachments/1191888158795771934/1474355625847685224/NO_DINHEIRO_SUJO_30_4.png";

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function renderTabela() {
    const linhas = document.getElementById('linhas');
    linhas.innerHTML = produtos.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td><td>${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0" class="input-table"></td>
            <td><span id="packs-${p.id}">0</span></td><td><span id="subtotal-${p.id}">R$ 0,00</span></td>
        </tr>
    `).join('');
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular));
}

function calcular() {
    let subtotalGeral = 0; let polTotal = 0; let carTotal = 0; let packsGeral = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        subtotalGeral += packs * p.precoPack;
        packsGeral += packs;
        polTotal += packs * p.pol; // 65, 85 ou 115 por pack
        carTotal += packs * p.car;
        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = formatoBRL(packs * p.precoPack);
    });

    const final = subtotalGeral * (1 - descontoAtual / 100);
    document.getElementById('totalSemDesconto').textContent = formatoBRL(subtotalGeral);
    document.getElementById('descontoAplicado').textContent = descontoAtual + "%";
    document.getElementById('totalComDesconto').textContent = formatoBRL(final);
    document.getElementById('comissaoValor').textContent = formatoBRL(final * 0.10); // 10%
    document.getElementById('totalPacks').textContent = packsGeral;
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${polTotal}</strong> | 🐚 Cartuchos: <strong>${carTotal}</strong>`;
}

// FINALIZAR E ENVIAR
document.getElementById('confirmarRegistro').addEventListener('click', async () => {
    const btn = document.getElementById('confirmarRegistro');
    let detalhes = "";
    produtos.forEach(p => {
        const q = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (q > 0) detalhes += `🔹 **${p.nome.replace("Munição de ", "")}:** ${q} un.\n`;
    });

    if (!detalhes) return alert("Selecione as munições!");
    btn.disabled = true; btn.innerText = "⏳ Gravando...";

    const situacao = document.getElementById('situacao').value;
    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        total: document.getElementById('totalComDesconto').textContent,
        comissao: document.getElementById('comissaoValor').textContent,
        desconto: descontoAtual + "%",
        detalhes: detalhes,
        materiais: document.getElementById('materialCalc').innerText
    };

    try {
        const res = await fetch(URL_CONTADOR_GLOBAL, { method: 'POST', body: JSON.stringify(dados) });
        const id = "#" + (await res.text()).padStart(4, '0');

        const embedEnc = {
            title: `📋 REGISTRO DE ENCOMENDA ${id}`, color: 34857,
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: dados.total, inline: true },
                { name: "📦 Detalhes", value: detalhes, inline: false },
                { name: "🚦 Status", value: situacao, inline: true },
                { name: "🧨 Materiais", value: dados.materiais, inline: true }
            ], image: { url: imgDGS }
        };

        await fetch(webhooks.encomenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedEnc] }) });
        
        if (situacao.includes('✅')) await dispararLogsFinais(id, dados, situacao);

        alert(`✅ Pedido ${id} enviado!`);
        location.reload();
    } catch (e) { alert("Erro ao enviar."); btn.disabled = false; btn.innerText = "Finalizar e Enviar"; }
});

async function dispararLogsFinais(id, dados, situacao) {
    const embedVenda = {
        title: `✅ VENDA REGISTRADA ${id}`, color: 43266,
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "📦 Detalhes", value: dados.detalhes, inline: false },
            { name: "💰 Total", value: dados.total, inline: true }
        ]
    };
    const embedCom = {
        title: `💸 COMISSÃO GERADA ${id}`, color: 4170239,
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "💰 Total Venda", value: dados.total, inline: true },
            { name: "💸 Comissão", value: dados.comissao, inline: true },
            { name: "📉 Desconto", value: dados.desconto, inline: true },
            { name: "🚦 Status", value: situacao, inline: true }
        ]
    };
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedVenda] }) });
    await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedCom] }) });
}

// CONTROLE DE ABAS E INTERFACE
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const info = document.getElementById('info-parceria');
        info.textContent = parcerias[descontoAtual];
        info.className = `info-parceria ${descontoAtual === 0 ? 'alerta-venda' : 'info-venda'}`;
        calcular();
    });
});

document.getElementById('btnAbrirForm').addEventListener('click', () => {
    document.getElementById('formUpdate').classList.add('hidden');
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

document.getElementById('btnToggleUpdate').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.toggle('hidden');
});

document.getElementById('limparOrcamento').addEventListener('click', () => location.reload());

renderTabela();
document.getElementById('info-parceria').textContent = parcerias[0];
document.getElementById('info-parceria').className = "info-parceria alerta-venda";