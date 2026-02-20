const PACK_SIZE = 250;
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

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// FUNÇÕES DE CÁLCULO
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
    let subGeral = 0; let polTotal = 0; let carTotal = 0; let packsGeral = 0;
    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        subGeral += packs * p.precoPack;
        packsGeral += packs;
        polTotal += packs * p.pol;
        carTotal += packs * p.car;
        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = formatoBRL(packs * p.precoPack);
    });

    const final = subGeral * (1 - descontoAtual / 100);
    document.getElementById('totalSemDesconto').textContent = formatoBRL(subGeral);
    document.getElementById('descontoAplicado').textContent = descontoAtual + "%";
    document.getElementById('totalComDesconto').textContent = formatoBRL(final);
    document.getElementById('comissaoValor').textContent = formatoBRL(final * 0.10);
    document.getElementById('totalPacks').textContent = packsGeral;
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${polTotal}</strong> | 🐚 Cartuchos: <strong>${carTotal}</strong>`;
}

// LOGICA DOS BOTÕES (CORREÇÃO PARA ABRIR O FORMS)
document.getElementById('btnAbrirForm').addEventListener('click', () => {
    document.getElementById('formUpdate').classList.add('hidden');
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

document.getElementById('btnToggleUpdate').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.toggle('hidden');
});

// LISTENERS DAS ABAS
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

document.getElementById('limparOrcamento').addEventListener('click', () => location.reload());

renderTabela();
document.getElementById('info-parceria').textContent = parcerias[0];
document.getElementById('info-parceria').className = "info-parceria alerta-venda";