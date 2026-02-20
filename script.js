const PACK_SIZE = 250;
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbxaOoXnuCWiedqgG5XFr4EWCNTr5_ohr6pfavnqfdG0FAR270mRE02N9OXYi1Ec-GpX4g/exec";

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

const imgDGS = "https://cdn.discordapp.com/attachments/1191888158795771934/1474355625847685224/NO_DINHEIRO_SUJO_30_4.png?ex=69998c2d&is=69983aad&hm=f02638f1272fabdcc06ca6580ab76e5e8ce3c9580d8ec0535dcb2faaef703c31&";

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function renderTabela() {
    document.getElementById('linhas').innerHTML = produtos.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td><td>${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0" class="input-table"></td>
            <td><span id="packs-${p.id}">0</span></td><td><span id="subtotal-${p.id}">R$ 0,00</span></td>
        </tr>
    `).join('');
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular));
}

function calcular() {
    let subGeral = 0;
    let polTotal = 0;
    let carTotal = 0;
    let materialTexto = "";

    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subItem = packs * p.precoPack;
        
        subGeral += subItem;
        
        // Cálculo de Materiais por Pack
        const pol = packs * p.pol;
        const car = packs * p.car;
        polTotal += pol;
        carTotal += car;

        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = formatoBRL(subItem);
    });

    const totalFinal = subGeral * (1 - descontoAtual / 100);
    document.getElementById('totalSemDesconto').textContent = formatoBRL(subGeral);
    document.getElementById('descontoAplicado').textContent = descontoAtual + "%";
    document.getElementById('totalComDesconto').textContent = formatoBRL(totalFinal);
    document.getElementById('comissaoValor').textContent = formatoBRL(totalFinal * 0.10);
    
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${polTotal}</strong> | 🐚 Cartuchos: <strong>${carTotal}</strong>`;
}

function gerarDetalhes() {
    let d = "";
    produtos.forEach(p => {
        const q = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (q > 0) d += `🔹 **${p.nome.replace("Munição de ", "")}:** ${q} un.\n`;
    });
    return d;
}

// REGISTRO
document.getElementById('confirmarRegistro').addEventListener('click', async () => {
    const detalhes = gerarDetalhes();
    if (!detalhes) return alert("Adicione munições!");
    const btn = document.getElementById('confirmarRegistro');
    btn.disabled = true; btn.innerText = "⏳ Enviando...";

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
        const embed = {
            title: `📋 REGISTRO DE ENCOMENDA ${id}`, color: 34857,
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: dados.total, inline: true },
                { name: "📦 Detalhes", value: detalhes, inline: false },
                { name: "🚦 Status", value: document.getElementById('situacao').value, inline: true },
                { name: "🧨 Materiais", value: dados.materiais, inline: true }
            ], image: { url: imgDGS }
        };
        await fetch(webhooks.encomenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embed] }) });
        if (document.getElementById('situacao').value.includes('✅')) await dispararLogsFinais(id, dados, "✅ Entregues");
        alert(`✅ Pedido ${id} enviado!`);
        location.reload();
    } catch (e) { alert("Erro ao enviar."); btn.disabled = false; }
});

// ATUALIZAR
document.getElementById('btnUpdateStatus').addEventListener('click', async () => {
    const idLimpo = document.getElementById('updateNumPedido').value.replace('#', '').replace(/^0+/, '');
    const situ = document.getElementById('updateSituacao').value;
    if (!idLimpo) return alert("Digite o número!");
    const btn = document.getElementById('btnUpdateStatus');
    btn.disabled = true; btn.innerText = "🔍 Buscando...";

    try {
        const res = await fetch(`${URL_CONTADOR_GLOBAL}?id=${idLimpo}`);
        const data = await res.json();
        if (data === "erro") return alert("Pedido não encontrado!");
        if (situ.includes('✅')) await dispararLogsFinais("#" + idLimpo.padStart(4, '0'), data, situ);
        alert("✅ Status Atualizado!");
        location.reload();
    } catch (e) { alert("Erro ao buscar dados."); btn.disabled = false; }
});

async function dispararLogsFinais(id, dados, situacao) {
    const embedReg = {
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
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedReg] }) });
    await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedCom] }) });
}

// TABS GATILHO DE CÁLCULO
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const info = document.getElementById('info-parceria');
        info.textContent = parcerias[descontoAtual];
        info.className = `info-parceria ${descontoAtual === 0 ? 'alerta-venda' : 'info-venda'}`;
        calcular(); // Recalcula na hora ao trocar a aba
    });
});

document.getElementById('btnAbrirForm').addEventListener('click', () => { document.getElementById('formUpdate').classList.add('hidden'); document.getElementById('formEncomenda').classList.toggle('hidden'); });
document.getElementById('btnToggleUpdate').addEventListener('click', () => { document.getElementById('formEncomenda').classList.add('hidden'); document.getElementById('formUpdate').classList.toggle('hidden'); });
document.getElementById('limparOrcamento').addEventListener('click', () => location.reload());

renderTabela();