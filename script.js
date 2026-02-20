const PACK_SIZE = 250;
// URL do seu Contador Global vinculada à Planilha Google
const URL_CONTADOR_GLOBAL = "https://script.google.com/macros/s/AKfycbwKK_9OGweYycdhWbHDVhtOvyBKYU6EDknD0XG2_XNs8JTUn93DV8E6fyEy5hBZtaYY/exec";

const produtos = [
    { id: 'pistola', nome: 'Munição de Pistola', precoPack: 32500 },
    { id: 'sub', nome: 'Munição de Sub/SMG', precoPack: 55000 },
    { id: 'fuzil', nome: 'Munição de Fuzil', precoPack: 85000 }
];

const parcerias = {
    0: "⚠️ Atenção: Não vender para pessoal de pista ou CPF munições de calibre maior que pistola.",
    20: "🤝 Parcerias 20%: Medellin, Cartel, Egito",
    30: "🤝 Parcerias 30%: Tropa da Russia, Golden"
};

let descontoAtual = 0;
const formatoBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

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
    document.getElementById('comissaoPorcentagem').textContent = (porcComissao * 100) + "%";
    
    atualizarMaterial();
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
    document.getElementById('materialCalc').innerHTML = `🧨 Pólvoras: <strong>${polvora}</strong> | 🐚 Cartuchos: <strong>${cartucho}</strong>`;
}

// Alternar abas de desconto e mensagens
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

// Abrir/Fechar Formulário
document.getElementById('btnAbrirForm').addEventListener('click', () => {
    document.getElementById('formEncomenda').classList.toggle('hidden');
});

// Limpar Orçamento
document.getElementById('limparOrcamento').addEventListener('click', () => {
    produtos.forEach(p => document.getElementById(`qtd-${p.id}`).value = 0);
    descontoAtual = 0;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab[data-desconto="0"]').classList.add('active');
    
    const infoEl = document.getElementById('info-parceria');
    infoEl.textContent = parcerias[0];
    infoEl.className = "info-parceria alerta-venda";
    
    document.getElementById('formEncomenda').classList.add('hidden');
    calcular();
});

document.getElementById('confirmarRegistro').addEventListener('click', enviarParaDiscord);

async function enviarParaDiscord() {
    const btn = document.getElementById('confirmarRegistro');
    btn.disabled = true;
    btn.innerText = "⏳ Gerando Pedido...";

    try {
        // Busca o número sequencial global na sua Planilha Google
        const responseContador = await fetch(URL_CONTADOR_GLOBAL);
        const numeroLimpo = await responseContador.text();
        const numPedido = "#" + numeroLimpo.padStart(4, '0');

        const webhooks = {
            encomenda: "https://discord.com/api/webhooks/1474128373520404612/CF3vXixIO1gf4494ddoL0uHFcN8Ittsc5E8kOIwgzWqL2UwRB539-q-5DIdC-O7QnQbY",
            registroVenda: "https://discord.com/api/webhooks/1474150006968680498/s5JnM0R5dWVna84bW6uM7gw_UrcllxwG30FaQzjcZ1NsKg6KnzCa3i6UhrDxGspdW2HJ",
            comissao: "https://discord.com/api/webhooks/1474356194046120162/HOQyAtwa5jK9gvtzgVEVggUCgPSUwJr1HP-1PNfHhNqBr-eu2xpc-BK9myhemRCY0b6h"
        };

        const situacao = document.getElementById('situacao').value;
        const comprador = document.getElementById('nomeComprador').value || "Não informado";
        const membro = document.getElementById('membro').value || "Não informado";
        const totalVenda = document.getElementById('totalComDesconto').innerText;
        const desconto = document.getElementById('descontoAplicado').innerText;
        const comissaoTotal = document.getElementById('comissaoValor').innerText;
        const materiais = document.getElementById('materialCalc').innerText;

        let produtosPedido = [];
        let qtdMuniTotal = 0;
        let tiposMuni = [];
        
        produtos.forEach(p => {
            const qtd = Number(document.getElementById(`qtd-${p.id}`).value) || 0;
            if (qtd > 0) {
                qtdMuniTotal += qtd;
                produtosPedido.push(`**${p.nome}**: ${qtd} un.`);
                tiposMuni.push(p.nome.replace("Munição de ", ""));
            }
        });

        // EMBED 1: ENCOMENDA (Canal Geral)
        const embedEncomenda = {
            title: `📦 REGISTRO DE ENCOMENDA ${numPedido}`,
            color: 1752220,
            fields: [
                { name: "👤 Comprador", value: comprador, inline: true },
                { name: "🛠️ Membro", value: membro, inline: true },
                { name: "💰 Total", value: `R$ ${totalVenda}`, inline: true },
                { name: "💸 Comissão", value: comissaoTotal, inline: true },
                { name: "Quantidade de munições*", value: `**${qtdMuniTotal}**`, inline: true },
                { name: "Tipo de Munição", value: `**${tiposMuni.join(", ")}**`, inline: true },
                { name: "🚦 Status", value: situacao, inline: true },
                { name: "📦 Materiais**", value: materiais, inline: false }
            ],
            image: { url: "https://i.imgur.com/kP8U8m6.png" }, // Imagem da DGS
            footer: { text: "Sistema de Gerenciamento Arsenal DGS" },
            timestamp: new Date()
        };

        // Envio inicial com menção
        await fetch(webhooks.encomenda, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ 
                content: `# **Olá <@1474353140148207687> temos uma nova encomenda!**`, 
                embeds: [embedEncomenda] 
            }) 
        });

        // Fluxo para pedidos finalizados
        if (situacao.includes('✅')) {
            const embedComissao = {
                title: `💸 COMISSÃO GERADA ${numPedido}`,
                color: 3066993,
                fields: [
                    { name: "👤 Comprador", value: comprador, inline: true },
                    { name: "🛠️ Membro", value: membro, inline: true },
                    { name: "💰 Total Venda", value: `**R$ ${totalVenda}**`, inline: true },
                    { name: "💸 Comissão", value: `**R$ ${comissaoTotal}**`, inline: true },
                    { name: "📉 Desconto", value: desconto, inline: true },
                    { name: "🚦 Status", value: situacao, inline: true }
                ]
            };

            const embedRegistro = {
                title: `✅ VENDA REGISTRADA ${numPedido}`,
                color: 2067276,
                fields: [
                    { name: "👤 Comprador", value: comprador, inline: true },
                    { name: "🛠️ Membro", value: membro, inline: true },
                    { name: "📦 Produtos", value: produtosPedido.join("\n"), inline: false },
                    { name: "📊 Quantidade", value: `${qtdMuniTotal} un.`, inline: true },
                    { name: "🚦 Status", value: situacao, inline: true },
                    { name: "💰 Total Venda", value: `**R$ ${totalVenda}**`, inline: true },
                    { name: "📉 Desconto", value: desconto, inline: true }
                ]
            };

            await fetch(webhooks.comissao, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedComissao] }) });
            await fetch(webhooks.registroVenda, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [embedRegistro] }) });
        }

        alert(`✅ Pedido ${numPedido} registrado globalmente!`);
        btn.disabled = false;
        btn.innerText = "Finalizar e Enviar";

    } catch (e) {
        alert("❌ Erro ao conectar com o contador global. Verifique se a URL do Script está correta e implantada como 'Qualquer pessoa'.");
        btn.disabled = false;
        btn.innerText = "Finalizar e Enviar";
        console.error(e);
    }
}

// Inicialização
renderTabela();
calcular();
document.getElementById('info-parceria').textContent = parcerias[0];
document.getElementById('info-parceria').className = "info-parceria alerta-venda";