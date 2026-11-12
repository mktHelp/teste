# Funil "Quero ser Franqueado"

Landing page React + TypeScript (Vite), mobile first, com 4 seções: Hero, 3 Benefícios, Formulário e Rodapé.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173 — envia leads REAIS ao webhook
npm run dev:mock   # testa funil + GTM SEM enviar leads (usa .env.mock)
npm run build      # gera /dist
```

## GTM e conversão

O código envia eventos ao `dataLayer`. Tags, pixels e conversões são configurados **no GTM**.

- **Sem `VITE_GTM_ID`** → **modo simulação**: o `dataLayer` funciona normalmente, mas nenhum
  script externo é carregado. Os eventos aparecem no console e no painel flutuante **"GTM simulado"**.
- **Com `VITE_GTM_ID=GTM-XXXXXXX`** → carrega o container real. O painel some; para vê-lo em
  produção, acesse a página com `?gtm_debug=1`.

### Eventos do funil

| Evento | Quando dispara | Parâmetros |
|---|---|---|
| `funnel_view` | carregamento da página (1x) | `funnel_name`, `page_location`, `page_title` |
| `cta_click` | clique em "Quero ser franqueado" | `cta_location` (`topbar` / `hero`) |
| `form_view` | 40% do formulário visível (1x) | `form_id` |
| `form_start` | primeiro foco em um campo (1x) | `form_id`, `first_field` |
| `form_error` | envio com campos inválidos | `error_fields`, `error_count` |
| `form_submit_error` | webhook falhou | `error_message` |
| **`generate_lead`** | **CONVERSÃO** — só após o webhook confirmar | ver abaixo |

`generate_lead` leva: `lead_id` (o mesmo enviado ao n8n, use como ID de deduplicação),
`lead_uf`, `lead_possui_capital`, `lead_qualificado` (true se possui capital), `currency`, `value`
e `user_data.sha256_email_address` / `user_data.sha256_phone_number`.
**Nenhum dado pessoal vai em texto puro para o dataLayer**: e-mail (minúsculo) e telefone
(`+55DDDNÚMERO`) seguem só como hash SHA-256, formato aceito pelas conversões otimizadas do
Google Ads e pela API de Conversões da Meta.

### Configuração sugerida no GTM

1. **Variáveis (Data Layer Variable):** `lead_id`, `lead_uf`, `lead_possui_capital`,
   `lead_qualificado`, `user_data.sha256_email_address`, `user_data.sha256_phone_number`.
2. **Acionador:** Evento personalizado `generate_lead`. Para otimizar só por leads com capital,
   crie outro acionador com a condição `lead_qualificado` igual a `true`.
3. **Tags:**
   - GA4 – Evento `generate_lead` (marque como evento-chave no GA4);
   - Google Ads – Conversão (ID da transação = `{{lead_id}}`, com dados fornecidos pelo usuário);
   - Meta Pixel – `fbq('track', 'Lead', {}, {eventID: {{lead_id}}})`.
4. Teste no **Preview** do GTM com `npm run dev:mock` antes de publicar o container.

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

### UTMs

`utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term` são lidos da URL no
carregamento (`src/utils/utm.ts`) e enviados junto com o lead, além de irem nos eventos
`funnel_view` e `generate_lead` do dataLayer.

- **Atribuição por último clique com UTM:** uma URL com qualquer UTM substitui todas as UTMs salvas.
- **Persistência de 30 dias** (`localStorage`): se a pessoa recarregar ou voltar sem UTMs na URL,
  o lead mantém a última origem. Se o navegador bloquear o storage, vale só a URL atual.
- UTM ausente segue como string vazia (`""`), então o n8n sempre recebe as 5 chaves.

Payload enviado (POST JSON):

```json
{
  "leadId": "1752ddc1-e29f-4519-8195-d88720418294",
  "nome": "Maria Silva",
  "whatsapp": "11912345678",
  "email": "maria@email.com",
  "cidade": "Campinas",
  "uf": "SP",
  "possuiCapital": "sim",
  "origem": "funil-quero-ser-franqueado",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "franquia_nov26",
  "utm_content": "video_depoimento",
  "utm_term": "franquia de multas",
  "pagina": "https://seu-dominio.com.br/#formulario",
  "enviadoEm": "2026-11-12T12:00:00.000Z"
}
```
