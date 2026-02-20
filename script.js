const PACK_SIZE = 250;
const produtos = [
    { id: 'pistola', nome: 'Munição de Pistola', precoPack: 32500 },
    { id: 'sub', nome: 'Munição de Sub/SMG', precoPack: 55000 },
    { id: 'fuzil', nome: 'Munição de Fuzil', precoPack: 85000 }
];

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function renderTabela() {
    const linhas = document.getElementById('linhas');
    linhas.innerHTML = produtos.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td>
            <td>R$ ${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0" class="input-table"></td>
            <td><span id="packs-${p.id}" class="badge-pack">0</span></td>
            <td><span id="subtotal-${p.id}">R$ 0,00</span></td>
        </tr>
    `).join('');

    produtos.forEach(p => {
        document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular);
    });
}

function calcular() {
    let packsTotal = 0;
    let total = 0;
    let qtdBruta = 0;

    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subtotal = packs * p.precoPack;

        qtdBruta += qtd;
        packsTotal += packs;
        total += subtotal;

        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = `R$ ${formatoBRL(subtotal)}`;
    });

    const totalFinal = total * (1 - descontoAtual / 100);
    const porcComissao = qtdBruta > 2000 ? 0.10 : 0.05;
    const valorComissao = totalFinal * porcComissao;

    // Atualiza Resumo
    document.getElementById('totalPacks').textContent = packsTotal;
    document.getElementById('totalSemDesconto').textContent = `R$ ${formatoBRL(total)}`;
    document.getElementById('descontoAplicado').textContent = `${descontoAtual}%`;
    document.getElementById('totalComDesconto').textContent = `R$ ${formatoBRL(totalFinal)}`;
    
    document.getElementById('comissaoValor').textContent = `R$ ${formatoBRL(valorComissao)}`;
    document.getElementById('comissaoPorcentagem').textContent = (porcComissao * 100) + "%";

    atualizarMaterial(packsTotal);
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
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: ${polvora} | 🐚 Cartuchos: ${cartucho}`;
}

// Eventos de Clique
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        calcular();
    });
});

document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const webhooks = {
        geral: "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY",
        entregas: "https://discord.com/api/webhooks/1474150006968680498/s5JnM0R5dWVna84bW6uM7gw_UrcllxwG30FaQzjcZ1NsKg6KnzCa3i6UhrDxGspdW2HJ"
    };

    const situacao = document.getElementById('situacao').value;
    const corpo = {
        embeds: [{
            title: "📋 REGISTRO DE ARSENAL",
            color: situacao.includes('✅') ? 2253657 : 16753920,
            fields: [
                { name: "👤 Comprador", value: document.getElementById('nomeComprador').value || "---", inline: true },
                { name: "🛠️ Membro", value: document.getElementById('membro').value || "---", inline: true },
                { name: "💰 Total", value: document.getElementById('totalComDesconto').innerText, inline: true },
                { name: "💸 Comissão", value: document.getElementById('comissaoValor').innerText, inline: true },
                { name: "🚦 Status", value: situacao, inline: true },
                { name: "📦 Materiais", value: document.getElementById('materialCalc').innerText, inline: false }
            ],
            timestamp: new Date()
        }]
    };

    await fetch(webhooks.geral, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo) });
    if(situacao.includes('✅')) {
        await fetch(webhooks.entregas, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo) });
    }
    alert("✅ Enviado com sucesso!");
}

renderTabela();