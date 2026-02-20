const PACK_SIZE = 250;
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbxaOoXnuCWiedqgG5XFr4EWCNTr5_ohr6pfavnqfdG0FAR270mRE02N9OXYi1Ec-GpX4g/exec";

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
    let packsTotal = 0; let totalGeral = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subtotal = packs * p.precoPack;
        packsTotal += packs; totalGeral += subtotal;
        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = formatoBRL(subtotal);
    });
    const totalFinal = totalGeral * (1 - descontoAtual / 100);
    const valorComissao = totalFinal * 0.10; 

    document.getElementById('totalPacks').textContent = packsTotal;
    document.getElementById('totalSemDesconto').textContent = formatoBRL(totalGeral);
    document.getElementById('descontoAplicado').textContent = `${descontoAtual}%`;
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
    document.getElementById('materialCalc').textContent = `🧨 Pólvoras: ${pol} | 🐚 Cartuchos: ${car}`;
}

function gerarDetalhesProdutos() {
    let detalhes = ""; let nomesMuni = [];
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (qtd > 0) {
            detalhes += `🔹 **${p.nome.replace("Munição de ", "")}:** ${qtd} un.\n`;
            nomesMuni.push(p.nome.replace("Munição de ", ""));
        }
    });
    return { string: detalhes, nomes: nomesMuni.join(", ") };
}

// BOTÕES DE REGISTRO
document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const btn = document.getElementById('confirmarRegistro');
    const detalhes = gerarDetalhesProdutos();
    if (!detalhes.string) return alert("Adicione munições!");

    btn.disabled = true; btn.innerText = "⏳ Enviando...";
    const situacao = document.getElementById('situacao').value;

    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        total: document.getElementById('totalComDesconto').textContent,
        comissao: document.getElementById('comissaoValor').textContent,
        desconto: descontoAtual + "%",
        materiais: document.getElementById('materialCalc').textContent,
        produtos: detalhes.nomes,
        detalhes: detalhes.string
    };

    try {
        const response = await fetch(URL_CONTADOR_GLOBAL, { method: 'POST', body: JSON.stringify(dados) });
        const numID = await response.text();
        const idPedido = "#" + numID.padStart(4, '0');

        const embedEnc = {
            title: `📋 REGISTRO DE ENCOMENDA ${idPedido}`,
            color: 34857, // Azul DGS
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: dados.total, inline: true },
                { name: "📦 Detalhes", value: detalhes.string, inline: false },
                { name: "🚦 Status", value: situacao, inline: true },
                { name: "🧨 Materiais", value: dados.materiais, inline: true }
            ],
            image: { url: imgDGS }
        };

        await fetch(webhooks.encomenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedEnc] }) });

        if (situacao.includes('✅')) await dispararLogsFinais(idPedido, dados, situacao);

        alert(`✅ Pedido ${idPedido} enviado!`);
        location.reload();
    } catch (e) { alert("Erro ao enviar."); btn.disabled = false; }
}

// BOTÃO DE ATUALIZAÇÃO
document.getElementById('btnUpdateStatus').addEventListener('click', async () => {
    const idNum = document.getElementById('updateNumPedido').value.replace('#', '');
    const situ = document.getElementById('updateSituacao').value;
    const btn = document.getElementById('btnUpdateStatus');

    if (!idNum) return alert("Digite o número do pedido!");
    btn.disabled = true; btn.innerText = "🔍 Buscando...";

    try {
        const res = await fetch(`${URL_CONTADOR_GLOBAL}?id=${idNum}`);
        const data = await res.json();
        if (data !== "erro" && situ.includes('✅')) {
            await dispararLogsFinais("#" + idNum.padStart(4, '0'), data, situ);
            alert("✅ Status Atualizado!");
            location.reload();
        } else { alert("Status atualizado!"); location.reload(); }
    } catch (e) { alert("Erro ao buscar dados."); btn.disabled = false; }
});

async function dispararLogsFinais(id, dados, situacao) {
    const embedReg = {
        title: `✅ VENDA REGISTRADA ${id}`, color: 43266, // Verde
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "📦 Detalhes", value: dados.detalhes || dados.produtos, inline: false },
            { name: "💰 Total", value: dados.total, inline: true }
        ]
    };
    const embedCom = {
        title: `💸 COMISSÃO GERADA ${id}`, color: 4170239, // Azul Claro
        fields: [
            { name: "👤 Comprador", value: dados.comprador, inline: true },
            { name: "🛠️ Membro", value: dados.membro, inline: true },
            { name: "💰 Total Venda", value: dados.total, inline: true },
            { name: "💸 Comissão", value: dados.comissao, inline: true },
            { name: "📉 Desconto", value: dados.desconto || "0%", inline: true }
        ]
    };
    await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedReg] }) });
    await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedCom] }) });
}

// CONTROLE DE INTERFACE
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