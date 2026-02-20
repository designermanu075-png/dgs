const PACK_SIZE = 250;
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbx5I8DIB1pQ0e6VOA3Nol7e04Iyp1f-muy400JB9zmO5GDA8vlh3otrMTfrfCMUs2VYIA/exec";

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
    0: "⚠️ Atenção: Não vender calibres maiores que pistola para CPF.",
    20: "🤝 Parcerias 20%: Medellin, Cartel, Egito",
    30: "🤝 Parcerias 30%: Tropa da Russia, Golden"
};

const imgDGS = "https://cdn.discordapp.com/attachments/1191888158795771934/1474355625847685224/NO_DINHEIRO_SUJO_30_4.png?ex=69998c2d&is=69983aad&hm=f02638f1272fabdcc06ca6580ab76e5e8ce3c9580d8ec0535dcb2faaef703c31&";

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function renderTabela() {
    const tabelaCorpo = document.getElementById('linhas');
    tabelaCorpo.innerHTML = produtos.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td>
            <td>${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0" class="input-table"></td>
            <td><span id="packs-${p.id}">0</span></td>
            <td><span id="subtotal-${p.id}">R$ 0,00</span></td>
        </tr>
    `).join('');
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular));
}

function calcular() {
    let subGeral = 0; let packsGeral = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subItem = packs * p.precoPack;
        subGeral += subItem; packsGeral += packs;
        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = formatoBRL(subItem);
    });
    
    const totalFinal = subGeral * (1 - descontoAtual / 100);
    const valorComissao = totalFinal * 0.10;

    document.getElementById('totalPacks').textContent = packsGeral;
    document.getElementById('totalSemDesconto').textContent = formatoBRL(subGeral);
    document.getElementById('descontoAplicado').textContent = descontoAtual + "%";
    document.getElementById('totalComDesconto').textContent = formatoBRL(totalFinal);
    document.getElementById('comissaoValor').textContent = formatoBRL(valorComissao);
    
    atualizarMaterial();
}

function atualizarMaterial() {
    let pol = 0; let car = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        if (p.id === 'pistola') pol += packs * 65;
        if (p.id === 'sub') pol += packs * 85;
        if (p.id === 'fuzil') pol += packs * 115;
        car += packs * 250;
    });
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${pol}</strong> | 🐚 Cartuchos: <strong>${car}</strong>`;
}

function gerarDetalhes() {
    let detalhes = "";
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (qtd > 0) detalhes += `🔹 **${p.nome.replace("Munição de ", "")}:** ${qtd} un.\n`;
    });
    return detalhes;
}

// FINALIZAR E ENVIAR
document.getElementById('confirmarRegistro').addEventListener('click', async () => {
    const btn = document.getElementById('confirmarRegistro');
    const detalhes = gerarDetalhes();
    if (!detalhes) return alert("Adicione munições!");

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
        const response = await fetch(URL_CONTADOR_GLOBAL, { method: 'POST', body: JSON.stringify(dados) });
        const numID = await response.text();
        const idPedido = "#" + numID.padStart(4, '0');

        const embedEnc = {
            title: `📋 REGISTRO DE ENCOMENDA ${idPedido}`,
            color: 34857,
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: dados.total, inline: true },
                { name: "📦 Detalhes", value: detalhes, inline: false },
                { name: "🚦 Status", value: situacao, inline: true }
            ],
            image: { url: imgDGS }
        };

        await fetch(webhooks.encomenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedEnc] }) });

        if (situacao.includes('✅')) await dispararLogsFinais(idPedido, dados, situacao);

        alert(`✅ Pedido ${idPedido} enviado!`);
        location.reload();
    } catch (e) { alert("Erro ao enviar."); btn.disabled = false; }
});

// ATUALIZAR STATUS (BUSCA)
document.getElementById('btnUpdateStatus').addEventListener('click', async () => {
    const inputVal = document.getElementById('updateNumPedido').value;
    const idLimpo = inputVal.replace('#', '').replace(/^0+/, '');
    const situ = document.getElementById('updateSituacao').value;
    const btn = document.getElementById('btnUpdateStatus');

    if (!idLimpo) return alert("Digite o número do pedido!");
    btn.disabled = true; btn.innerText = "🔍 Buscando...";

    try {
        const res = await fetch(`${URL_CONTADOR_GLOBAL}?id=${idLimpo}`);
        const data = await res.json();

        if (data === "erro") {
            alert("❌ Pedido não encontrado na planilha!");
        } else if (situ.includes('✅')) {
            await dispararLogsFinais("#" + idLimpo.padStart(4, '0'), data, situ);
            alert("✅ Status Atualizado!");
            location.reload();
        } else {
            alert("Status alterado.");
            location.reload();
        }
    } catch (e) { alert("Erro ao buscar dados."); }
    finally { btn.disabled = false; btn.innerText = "Confirmar Atualização"; }
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
            { name: "📉 Desconto", value: dados.desconto, inline: true }
        ]
    };
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedReg] }) });
    await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedCom] }) });
}

// INTERFACE
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
    document.getElementById('formUpdate').classList.add('hidden');
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

document.getElementById('btnToggleUpdate').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.toggle('hidden');
});

document.getElementById('limparOrcamento').addEventListener('click', () => location.reload());

renderTabela();