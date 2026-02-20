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

const imgDGS = "https://cdn.discordapp.com/attachments/1191888158795771934/1474355625847685224/NO_DINHEIRO_SUJO_30_4.png";

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function renderTabela() {
    const tabela = document.getElementById('linhas');
    tabela.innerHTML = produtos.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td>
            <td>${formatoBRL(p.precoPack)}</td>
            <td><input id="qtd-${p.id}" type="number" min="0" step="50" value="0" class="input-table"></td>
            <td><span id="packs-${p.id}">0</span></td>
            <td><span id="subtotal-${p.id}">R$ 0,00</span></td>
        </tr>
    `).join('');
    // Adiciona evento de escuta em cada campo de munição para calcular na hora
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).addEventListener('input', calcular));
}

function calcular() {
    let subtotalGeral = 0;
    let packsGeral = 0;
    let polTotal = 0;
    let carTotal = 0;

    produtos.forEach(p => {
        const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        const packs = Math.ceil(qtd / PACK_SIZE);
        const subtotalItem = packs * p.precoPack;
        
        subtotalGeral += subtotalItem;
        packsGeral += packs;
        
        // Cálculo de materiais baseado na taxa de cada munição
        polTotal += packs * p.pol;
        carTotal += packs * p.car;

        document.getElementById(`packs-${p.id}`).textContent = packs;
        document.getElementById(`subtotal-${p.id}`).textContent = formatoBRL(subtotalItem);
    });

    const totalFinal = subtotalGeral * (1 - descontoAtual / 100);
    const comissao = totalFinal * 0.10; // 10% de comissão

    // Atualiza o Resumo Financeiro na tela
    document.getElementById('totalSemDesconto').textContent = formatoBRL(subtotalGeral);
    document.getElementById('descontoAplicado').textContent = descontoAtual + "%";
    document.getElementById('totalComDesconto').textContent = formatoBRL(totalFinal);
    document.getElementById('comissaoValor').textContent = formatoBRL(comissao);
    document.getElementById('totalPacks').textContent = packsGeral;
    
    // Atualiza o Box de Materiais individuais
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${polTotal}</strong> | 🐚 Cartuchos: <strong>${carTotal}</strong>`;
}

// Controle das abas de desconto
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        descontoAtual = Number(btn.dataset.desconto);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        calcular(); // Recalcula os valores e descontos imediatamente
    });
});

// Registrar e Enviar
document.getElementById('confirmarRegistro').addEventListener('click', async () => {
    const btn = document.getElementById('confirmarRegistro');
    let detalhes = "";
    produtos.forEach(p => {
        const q = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
        if (q > 0) detalhes += `🔹 **${p.nome.replace("Munição de ", "")}:** ${q} un.\n`;
    });

    if (!detalhes) return alert("Selecione a quantidade de munições!");
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
            title: `📋 REGISTRO DE ENCOMENDA ${id}`,
            color: 22185, 
            fields: [
                { name: "👤 Comprador", value: dados.comprador, inline: true },
                { name: "🛠️ Membro", value: dados.membro, inline: true },
                { name: "💰 Total", value: dados.total, inline: true },
                { name: "📦 Detalhes", value: detalhes, inline: false },
                { name: "🚦 Status", value: document.getElementById('situacao').value, inline: true }
            ],
            image: { url: imgDGS }
        };

        await fetch(webhooks.encomenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embed] }) });
        alert(`✅ Pedido ${id} enviado!`);
        location.reload();
    } catch (e) { alert("Erro ao enviar."); btn.disabled = false; }
});

document.getElementById('btnToggleUpdate').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.add('hidden');
    document.getElementById('formUpdate').classList.toggle('hidden');
});

document.getElementById('limparOrcamento').addEventListener('click', () => location.reload());

renderTabela();