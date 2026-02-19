const PACK_SIZE = 250;

const produtos = [
    { id: 'pistola', nome: 'Munição de Pistola', precoPack: 32500 },
    { id: 'sub', nome: 'Munição de Sub/SMG', precoPack: 55000 },
    { id: 'fuzil', nome: 'Munição de Fuzil', precoPack: 85000 }
];

const linhas = document.getElementById('linhas');
const totalPacksEl = document.getElementById('totalPacks');
const totalSemDescontoEl = document.getElementById('totalSemDesconto');
const descontoAplicadoEl = document.getElementById('descontoAplicado');
const totalComDescontoEl = document.getElementById('totalComDesconto');

let descontoAtual = 0;

const formatoBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function renderTabela() {
    linhas.innerHTML = produtos.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0"></td>
            <td id="packs-${p.id}">0</td>
            <td id="subtotal-${p.id}">R$ 0,00</td>
        </tr>
    `).join('');

    produtos.forEach(p => {
        document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular);
    });
}

function calcular() {
    let packsTotal = 0;
    let total = 0;

    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subtotal = packs * p.precoPack;

        packsTotal += packs;
        total += subtotal;

        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = `R$ ${formatoBRL(subtotal)}`;
    });

    const totalFinal = total * (1 - descontoAtual / 100);

    totalPacksEl.textContent = packsTotal;
    totalSemDescontoEl.textContent = formatoBRL(total);
    descontoAplicadoEl.textContent = `${descontoAtual}%`;
    totalComDescontoEl.textContent = formatoBRL(totalFinal);
    
    atualizarMaterial();
}

document.querySelectorAll('.tab[data-desconto]').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab[data-desconto]').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        calcular();
    });
});

document.getElementById('limparOrcamento').addEventListener('click', () => {
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).value = 0);
    descontoAtual = 0;
    calcular();
});

document.getElementById('registrarEncomenda').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

function atualizarMaterial() {
    let polvora = 0;
    let cartucho = 0;

    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);

        if (p.id === 'pistola') polvora += packs * 65;
        if (p.id === 'sub') polvora += packs * 85;
        if (p.id === 'fuzil') polvora += packs * 115;

        cartucho += packs * 250;
    });

    document.getElementById('materialCalc').innerHTML =
        `Pólvoras: <strong id="valPolvora">${polvora}</strong><br>Cartuchos: <strong id="valCartucho">${cartucho}</strong>`;
}

renderTabela();
calcular();

// --- LOGICA DE ENVIO PARA O DISCORD ---

document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    // Webhook 1: Registro Geral (Orçamentos)
    const webhookGeral = "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY";
    
    // Webhook 2: Aba de Entregas (NOVO)
    const webhookEntregas = "https://discord.com/api/webhooks/1474150006968680498/s5JnM0R5dWVna84bW6uM7gw_UrcllxwG30FaQzjcZ1NsKg6KnzCa3i6UhrDxGspdW2HJ";

    const situacao = document.getElementById('situacao').value;
    
    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        situacao: situacao,
        pistola: document.getElementById('qtd-pistola').value,
        smg: document.getElementById('qtd-sub').value,
        fuzil: document.getElementById('qtd-fuzil').value,
        totalPacks: document.getElementById('totalPacks').innerText,
        totalFinal: document.getElementById('totalComDesconto').innerText,
        materiais: document.getElementById('materialCalc').innerText.replace(/\n/g, " | ")
    };

    const corpoMensagem = {
        username: "Arsenal System",
        embeds: [{
            title: situacao === "✅ Entregues" ? "✅ ENCOMENDA FINALIZADA" : "📦 NOVO REGISTRO",
            color: situacao === "✅ Entregues" ? 3066993 : 15105570, // Verde se entregue, Laranja se pendente
            fields: [
                { name: "👤 Comprador", value: `\`${dados.comprador}\``, inline: true },
                { name: "🛠️ Membro", value: `\`${dados.membro}\``, inline: true },
                { name: "🚦 Situação", value: dados.situacao, inline: true },
                { name: "💰 Total", value: `**R$ ${dados.totalFinal}**`, inline: true },
                { name: "📦 Packs", value: dados.totalPacks, inline: true },
                { name: "🔫 Detalhes", value: `Pistola: ${dados.pistola} | Sub: ${dados.smg} | Fuzil: ${dados.fuzil}`, inline: false }
            ],
            footer: { text: "Data: " + new Date().toLocaleString('pt-BR') }
        }]
    };

    try {
        // SEMPRE envia para o Geral
        await fetch(webhookGeral, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpoMensagem)
        });

        // SE estiver marcado como "Entregue", envia TAMBÉM para a nova aba
        if (situacao === "✅ Entregues") {
            await fetch(webhookEntregas, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(corpoMensagem)
            });
            alert("✅ Registro geral e Entrega confirmados!");
        } else {
            alert("✅ Registro geral enviado com sucesso!");
        }

    } catch (error) {
        alert("❌ Erro ao conectar com o Discord.");
    }
}