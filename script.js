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
    
    atualizarMaterial(); // Garante que os materiais atualizem junto com os valores
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

// Botão que apenas mostra/esconde o formulário
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

// INICIALIZAÇÃO
renderTabela();
calcular();

// --- FUNÇÃO PARA O DISCORD ---

// Conecta a função ao botão "Confirmar Registro"
document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const webhookURL = "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY";

    // Capturando os dados com os IDs corretos que o seu script gera
    const dados = {
        comprador: document.getElementById('nomeComprador').value || "Não informado",
        membro: document.getElementById('membro').value || "Não informado",
        situacao: document.getElementById('situacao').value,
        
        // Quantidades (pegando dos inputs gerados no renderTabela)
        pistola: document.getElementById('qtd-pistola').value,
        smg: document.getElementById('qtd-sub').value,
        fuzil: document.getElementById('qtd-fuzil').value,

        // Totais e Materiais
        totalPacks: document.getElementById('totalPacks').innerText,
        totalFinal: document.getElementById('totalComDesconto').innerText,
        materiais: document.getElementById('materialCalc').innerText.replace(/\n/g, " | ")
    };

    const corpoMensagem = {
        username: "Sistema de Orçamentos",
        embeds: [{
            title: "📦 NOVA ENCOMENDA REGISTRADA",
            color: 5763719,
            fields: [
                { name: "👤 Comprador / FAC", value: `\`${dados.comprador}\``, inline: true },
                { name: "🛠️ Membro", value: `\`${dados.membro}\``, inline: true },
                { name: "🚦 Situação", value: dados.situacao, inline: true },
                
                { name: "━━━━━━━━━━━━━━━━━━━━", value: "**MUNIÇÕES**", inline: false },
                { name: "🔫 Pistola", value: `${dados.pistola} un.`, inline: true },
                { name: "🔫 Sub/SMG", value: `${dados.smg} un.`, inline: true },
                { name: "🔫 Fuzil", value: `${dados.fuzil} un.`, inline: true },
                
                { name: "━━━━━━━━━━━━━━━━━━━━", value: "**RESUMO FINAL**", inline: false },
                { name: "📦 Total Packs", value: dados.totalPacks, inline: true },
                { name: "💰 Total", value: `**R$ ${dados.totalFinal}**`, inline: true },
                { name: "🛠️ Produção", value: dados.materiais, inline: false }
            ],
            footer: { text: "Gerado em: " + new Date().toLocaleString('pt-BR') }
        }]
    };

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpoMensagem)
        });

        if (response.ok) {
            alert("✅ Encomenda enviada para o Discord!");
        } else {
            alert("❌ Erro ao enviar para o Discord.");
        }
    } catch (error) {
        alert("❌ Erro de conexão.");
    }
}