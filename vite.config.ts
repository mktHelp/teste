import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // loadEnv com prefixo '' inclui .env* e variáveis do ambiente (ex.: painel da Vercel)
  const env = loadEnv(mode, '.', '');

  // Segurança: build de produção SEM webhook geraria um site que "aceita" leads e não envia
  // nenhum. Preferimos quebrar o deploy com uma mensagem clara a perder leads em silêncio.
  if (command === 'build' && mode === 'production' && !env.VITE_LEAD_ENDPOINT?.trim()) {
    throw new Error(
      '\n\n[funil] VITE_LEAD_ENDPOINT não definido para o build de produção.\n' +
        'Cadastre a variável na hospedagem (Vercel → Settings → Environment Variables)\n' +
        'ou no arquivo .env, e rode o deploy novamente.\n',
    );
  }

  return {
    plugins: [react()],
  };
});
