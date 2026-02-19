export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { comprador, membro, situacao, polvora, cartucho } = req.body;

    const webhookURL = "COLE_SUA_WEBHOOK_AQUI";

    const payload = {
        content: `
📦 NOVA ENCOMENDA

👤 Comprador: ${comprador}
🧑 Membro: ${membro}
📌 Situação: ${situacao}

🧨 Pólvora usada: ${polvora}
🔩 Cartuchos usados: ${cartucho}
        `
    };

    try {

        await fetch(webhookURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        return res.status(200).json({ success: true });

    } catch (error) {

        return res.status(500).json({ error: "Erro ao enviar para Discord" });

    }
}
