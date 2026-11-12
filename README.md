# Funil "Quero ser Franqueado"

Landing page React + TypeScript (Vite), mobile first, com 4 seções: Hero, 3 Benefícios, Formulário e Rodapé.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist
```

## Design

Segue o **Help Multas Design System (Agiliza v2.0)**: Navy 900 `#1A2936` + Amber 400 `#FFD400`,
Urbanist (texto) e JetBrains Mono (números), botões em pílula, cards com raio de 24px,
inputs com raio de 12px e ícones Lucide com stroke 1.75. Os tokens ficam em `src/styles/global.css`.
Os logos oficiais estão em `public/`.

## Personalizar

- **Marca, contatos e redes**: `src/config/brand.ts` (contatos, endereço e CNPJ ainda são placeholders)
- **Números do Hero**: `src/components/Hero/Hero.tsx` (placeholders, troque por dados oficiais)
- **Textos**: em cada componente de `src/components/`
- **Envio do formulário**: `VITE_LEAD_ENDPOINT` no arquivo `.env` (já aponta para o webhook n8n).
  Sem essa variável, o envio é simulado e aparece no console. Depois de alterar o `.env`, reinicie o `npm run dev`.
  O webhook precisa aceitar CORS do domínio onde a página for publicada.

## Campos do formulário

Nome, WhatsApp (com máscara), e-mail, cidade, UF e "Possui capital para investir?" (Sim/Não) — todos obrigatórios e validados.

Payload enviado (POST JSON):

```json
{
  "nome": "Maria Silva",
  "whatsapp": "11912345678",
  "email": "maria@email.com",
  "cidade": "Campinas",
  "uf": "SP",
  "possuiCapital": "sim",
  "origem": "funil-quero-ser-franqueado",
  "enviadoEm": "2026-11-12T12:00:00.000Z"
}
```
