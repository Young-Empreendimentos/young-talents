# Guia de Troubleshooting - Login Google

## Problemas Comuns e Soluções

### 1. **Erro: "popup blocked" ou popup não abre**
- **Causa**: Navegador está bloqueando popups
- **Solução**: 
  - Verifique as configurações de privacidade do navegador
  - Adicione `localhost:5173` e `*.vercel.app` à lista de permissões

### 2. **Erro: "invalid_client" ou "redirect_uri_mismatch"**
- **Causa**: URI de redirecionamento não configurada no Google Cloud Console
- **Solução**:
  1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
  2. Vá para "APIs & Services" → "Credentials"
  3. Edite a credencial OAuth 2.0
  4. Adicione URIs autorizados:
     - Local: `http://localhost:5173`
     - Produção: `https://seu-dominio.vercel.app`

### 3. **Erro: "FIREBASE: Error (auth/operation-not-supported-in-this-environment)"**
- **Causa**: Firebase não consegue inicializar em ambiente específico
- **Solução**:
  - Verifique se as variáveis de ambiente estão definidas
  - Confirme se o arquivo `.env.local` existe com valores corretos
  - Reinicie o servidor: `npm run dev`

### 4. **Erro: "Cannot find module" ou "undefined is not an object"**
- **Causa**: Dependências não instaladas
- **Solução**:
  ```bash
  npm install
  npm run dev
  ```

### 5. **Verificar Configuração Firebase**
```javascript
// No console do navegador, execute:
console.log(import.meta.env.VITE_FIREBASE_API_KEY)
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID)
```

## Configuração Local

1. Copie `.env.example` para `.env.local`
2. Preencha com suas credenciais Firebase
3. Reinicie o servidor

## Configuração Vercel

1. Acesse Vercel Dashboard
2. Selecione o projeto
3. Vá para Settings → Environment Variables
4. Adicione as 6 variáveis VITE_FIREBASE_*
5. Redeploy o projeto

## Logs de Debug

Para ver logs detalhados de autenticação:
1. Abra DevTools (F12)
2. Vá para Console
3. Execute: `firebase.auth().onAuthStateChanged(user => console.log('User:', user))`

## Verificação de CORS

Se receber erro de CORS:
1. No Firebase Console, vá para Authentication
2. Clique em "Settings"
3. Na seção "Authorized domains", adicione:
   - `localhost`
   - `seu-dominio.vercel.app`
