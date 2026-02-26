# 📖 Guia do Usuário - Young Talents ATS

Bem-vindo ao sistema de gerenciamento de recrutamento Young Talents ATS! Este guia irá ajudá-lo a utilizar todas as funcionalidades do sistema.

> **Novidades (Fevereiro 2026)**  
> Filtro “em consideração” com 3 opções, estrela em qualquer etapa, mensagens em português, salvar vaga sem “Quem autorizou”, botão Atualizar no header, log de movimentações na aba Administrativo do candidato. Detalhes em [NOVAS_FUNCIONALIDADES_E_AJUSTES.md](./NOVAS_FUNCIONALIDADES_E_AJUSTES.md).

---

## 🚀 Primeiros Passos

### 1. Acessar o Sistema
1. Acesse a URL do sistema fornecida pelo administrador
2. Clique em **"Entrar com Google"**
3. Selecione sua conta Google autorizada
4. Você será redirecionado para o Dashboard

### 2. Navegação Principal
O sistema possui 5 seções principais acessíveis pelo menu lateral:
- 📊 **Dashboard**: Visão geral com gráficos e KPIs
- 🔄 **Pipeline de Talentos**: Visualização Kanban do processo seletivo
- 💼 **Gestão de Vagas**: Gerenciamento de vagas abertas
- 👥 **Banco de Talentos**: Lista completa de candidatos
- ⚙️ **Configurações**: Ajustes do sistema

---

## 👥 Banco de Talentos

### Visualizar Candidatos
A tabela exibe todas as informações dos candidatos:
- **Nome, Email, Telefone**: Dados de contato
- **Cidade**: Localização do candidato
- **Fonte**: Onde o candidato encontrou a vaga
- **Áreas de Interesse**: Setores de interesse profissional
- **Formação e Escolaridade**: Dados acadêmicos
- **CNH**: Se possui habilitação
- **Status**: Etapa atual no processo
- **Data de Cadastro**: Quando foi cadastrado no sistema

### Buscar Candidatos
1. Digite na barra de busca no topo da tabela
2. A busca funciona em: nome, email, telefone, cidade, fonte, área de interesse, formação, escolaridade
3. Os resultados são filtrados em tempo real

### Ordenar Candidatos
1. Clique no cabeçalho da coluna desejada
2. Clique novamente para inverter a ordem (crescente/decrescente)
3. A seta (↑/↓) indica a direção da ordenação

### Filtrar Candidatos
1. Use os **três ícones de estrela** no topo para filtrar por “em consideração” (todos / só em consideração / só não considerados).
2. Clique no botão **"Filtros Avançados"** (ícone de filtro) no topo.
3. Selecione os filtros desejados:
   - **Período**: Últimos 7/30/90 dias ou período personalizado
   - **Status**: Selecione uma ou mais etapas do processo
   - **Vaga Vinculada**: Filtre por vaga específica
   - **Cidade**: Selecione múltiplas cidades (com busca por texto)
   - **Área de Interesse**: Selecione múltiplas áreas (com busca por texto)
   - **Fonte**: Selecione múltiplas origens (com busca por texto)
   - **Escolaridade, Estado Civil, CNH**: Filtros adicionais
3. Clique em **"Aplicar Filtros"**
4. Os filtros podem ser salvos para uso futuro

### Paginação
- Selecione quantos itens deseja ver por página (5, 10, 25, 50, 100, 500, 1000)
- Use os botões "Anterior" e "Próxima" para navegar
- A contagem mostra: "Mostrando X - Y de Z candidatos"

### Adicionar Novo Candidato
1. Clique no botão **"Adicionar"** no topo direito
2. Preencha as informações nas abas:
   - **Pessoal**: Dados pessoais e contato
   - **Profissional**: Formação, experiência, áreas de interesse
   - **Processo**: Vaga vinculada, status, fonte, expectativas
   - **Adicional**: Informações extras
3. Clique em **"Salvar"**

### Editar Candidato
1. Clique em qualquer linha da tabela ou no ícone de edição (lápis)
2. O formulário será aberto com os dados preenchidos
3. Faça as alterações necessárias
4. Clique em **"Salvar"**

### Avançar Etapa do Processo
1. Abra o formulário do candidato
2. Na primeira aba (Pessoal), você verá um menu destacado: **"Avançar Etapa do Processo"**
3. Selecione a próxima etapa desejada
4. Se houver campos obrigatórios faltando, um modal será aberto para preenchê-los
5. Confirme a transição

### Excluir Candidato
1. Clique no ícone de lixeira na coluna "Ações"
2. Confirme a exclusão
3. O candidato será marcado como excluído (soft delete) e não aparecerá mais nas listas

---

## 🔄 Pipeline de Talentos

### Visualização Kanban
O pipeline mostra os candidatos organizados em colunas por etapa:
- **Inscrito** → **Considerado** → **Entrevista I** → **Testes** → **Entrevista II** → **Seleção**

### Mover Candidato entre Etapas
1. **Arraste e solte**: Clique e segure o card do candidato, arraste para a coluna desejada e solte
2. **Menu de avanço**: Use o menu no formulário do candidato (primeira aba)

### Visualizar Detalhes do Candidato
- Clique em qualquer card do Kanban para abrir o formulário completo
- O card mostra: Nome, Vaga vinculada, Cidade, Área de Interesse, Empresa, Etapa atual
- **Estrela “em consideração”**: Clique na estrela no card (em qualquer etapa) para marcar ou desmarcar “em consideração”.

### Filtros no Pipeline
- **Busca local**: Digite para filtrar candidatos visíveis
- **Em consideração (estrela)**: Três ícones no topo — cinza (só não considerados), contorno amarelo (todos), preenchido (só em consideração). Passe o mouse para ver o tooltip.
- **Status**: Filtre por "Em Andamento", "Contratados", "Reprovados", "Todos"
- **Ordenação**: Mais Recentes, Mais Antigos, A-Z, Z-A

### Modo Lista
1. Clique no ícone de lista (ao lado do ícone Kanban)
2. Visualize candidatos em formato de tabela
3. Filtros adicionais disponíveis:
   - Etapa específica da pipeline
   - Vaga vinculada
   - Empresa da vaga
   - Cidade da vaga

### Paginação no Pipeline
- **Kanban**: Configure quantos candidatos ver por coluna (5, 10, 15, 20)
- **Lista**: Configure quantos candidatos ver por página (10, 25, 50, 100)
- Use os controles de paginação para navegar

### Personalizar Cores das Colunas
1. Vá em **Configurações** → **Configuração do Pipeline**
2. As cores podem ser personalizadas (funcionalidade em desenvolvimento)

---

## 💼 Gestão de Vagas

### Criar Nova Vaga
1. Clique no botão **"Nova"** no topo da página de Vagas
2. Preencha os campos obrigatórios (*):
   - **Título da Vaga**: Ex: "Analista de Obras"
   - **Empresa/Unidade**: Selecione ou crie uma nova empresa
   - **Cidade**: Selecione da lista de cidades
   - **Área de Interesse**: Selecione da lista de áreas
3. Preencha campos opcionais:
   - **Status**: Aberta, Preenchida, Cancelada, Fechada
   - **Tipo**: CLT, PJ, Estágio, etc.
   - **Faixa Salarial**: Ex: "R$ 3.000 - R$ 5.000"
   - **Descrição**: Detalhes da vaga
   - **Requisitos**: Qualificações necessárias
4. Clique em **"Salvar"**

### Criar Nova Empresa no Cadastro de Vaga
1. No campo "Empresa/Unidade", clique em **"Nova"**
2. Digite o nome da empresa
3. (Opcional) Selecione a cidade
4. Clique em **"Criar"**
5. A empresa será criada e selecionada automaticamente

### Visualizar Vagas por Categoria
Use as abas no topo:
- **Por Status**: Agrupa por status (Aberta, Preenchida, etc.)
- **Por Cidade**: Agrupa por cidade da vaga
- **Por Empresa**: Agrupa por empresa
- **Por Período**: Agrupa por mês de criação

### Editar Vaga
1. Clique no ícone de edição (lápis) no card da vaga
2. Faça as alterações necessárias
3. Clique em **"Salvar"**

### Alterar Status da Vaga
1. No card da vaga, use o dropdown de status no topo direito
2. Selecione o novo status
3. A alteração é salva automaticamente

### Ver Candidatos de uma Vaga
1. No card da vaga, clique no número de candidatos (ex: "5 candidatos")
2. Um modal será aberto mostrando todos os candidatos vinculados àquela vaga

### Excluir Vaga
1. Clique no ícone de lixeira no card da vaga
2. Confirme a exclusão
3. A vaga será marcada como excluída e não aparecerá mais nas listas

---

## 🏢 Gestão de Empresas/Unidades

### Acessar Gestão de Empresas
1. Vá em **Configurações** → **Empresas/Unidades**

### Criar Nova Empresa
1. Clique em **"Nova Empresa/Unidade"**
2. Preencha os campos:
   - **Nome***: Nome da empresa/unidade (obrigatório)
   - **Cidade**: Selecione da lista (opcional)
   - **Área de Interesse**: Selecione da lista (opcional)
   - **Endereço**: Endereço completo (opcional)
   - **Telefone**: Telefone de contato (opcional)
   - **Email**: Email de contato (opcional)
3. Clique em **"Criar"**

### Editar Empresa
1. Clique no ícone de edição (lápis) na linha da empresa
2. Faça as alterações
3. Clique em **"Atualizar"**

### Excluir Empresa
1. Clique no ícone de lixeira na linha da empresa
2. Confirme a exclusão

---

## 📥 Importação de Candidatos (CSV/XLSX)

### Preparar o Arquivo
1. Vá em **Configurações** → **Importar / Exportar**
2. Clique em **"Baixar Modelo"**
3. Escolha o formato: **CSV** ou **Excel (XLSX)**
4. O arquivo baixado contém:
   - Todas as colunas do sistema
   - 3 linhas de exemplo para referência

### Importar Arquivo
1. Preencha o arquivo modelo com os dados dos candidatos
2. Vá em **Configurações** → **Importar / Exportar**
3. Clique em **"Iniciar Importação"**
4. **Passo 1**: Selecione o arquivo CSV ou XLSX
5. **Passo 2**: Revise os vínculos de colunas:
   - Colunas reconhecidas automaticamente aparecem marcadas
   - Para colunas não reconhecidas, selecione o campo correspondente ou marque "Ignorar"
   - Verifique se os campos obrigatórios (Nome e Email) estão mapeados
6. **Passo 3**: Configure as opções:
   - **Duplicação**: Escolha como tratar candidatos com mesmo email
     - **Pular (Manter atual)**: Não importa se já existe
     - **Substituir / Atualizar**: Atualiza o candidato existente
     - **Duplicar**: Cria um novo registro mesmo se já existir
   - **Tag de Importação**: 
     - Automática: Nome do arquivo + data + hora
     - Personalizada: Digite uma tag customizada
7. Revise o preview dos dados (primeira linha mapeada)
8. Clique em **"Confirmar Importação"**
9. Aguarde o processamento
10. Uma mensagem mostrará quantos candidatos foram importados

### Dicas para Importação
- ✅ Use o modelo fornecido para garantir compatibilidade
- ✅ Certifique-se de que Nome e Email estão preenchidos
- ✅ Cidades, Fontes e Áreas de Interesse serão normalizadas automaticamente
- ✅ O sistema detecta automaticamente a maioria das colunas
- ⚠️ Se o número de candidatos detectados for muito alto (>5000), verifique se o arquivo está correto

---

## 📤 Exportação de Dados

### Exportar Candidatos ou Vagas
1. Vá em **Configurações** → **Importar / Exportar**
2. Na seção **"Exportar Dados"**:
   - Selecione o tipo: **Candidatos** ou **Vagas**
   - Escolha o formato: **CSV** ou **Excel**
3. Clique em **"Exportar"**
4. O arquivo será baixado automaticamente
5. A exportação será registrada no histórico de ações

---

## 📊 Dashboard

### KPIs Principais
O dashboard mostra 4 indicadores principais:
- **Total de Candidatos**: Total no banco de talentos
- **Contratados**: Quantidade de candidatos contratados
- **Vagas Abertas**: Vagas disponíveis
- **Reprovados**: Candidatos reprovados no processo

### Gráficos Interativos
- **Candidatos por Status**: Gráfico de pizza mostrando distribuição por etapa
- **Candidatos por Cidade**: Gráfico de barras das principais cidades
- **Candidatos por Fonte**: Gráfico de barras das origens (Facebook, Instagram, etc.)
- **Candidatos por Área de Interesse**: Gráfico de barras das áreas mais procuradas
- **Candidatos por Mês**: Gráfico de linha mostrando evolução temporal

### Interagir com Gráficos
- Passe o mouse sobre as barras/fatias para ver detalhes
- Clique nos KPIs para filtrar candidatos relacionados

---

## ⚙️ Configurações

### Gerenciamento de Campos
1. Vá em **Configurações** → **Gerenciamento de Campos**
2. Escolha a seção: **Campos do Candidato** ou **Campos da Vaga**
3. Use a busca para encontrar campos específicos
4. **Toggle de Visibilidade**: Clique no checkbox para mostrar/ocultar campos
5. **Toggle de Obrigatoriedade**: Clique no checkbox para tornar campos obrigatórios
6. ⚠️ Edição completa de campos está em desenvolvimento

### Configuração do Pipeline
1. Vá em **Configurações** → **Configuração do Pipeline**
2. **Adicionar Etapa**:
   - Clique em "Adicionar Etapa"
   - Digite o nome da nova etapa
   - Clique em "Adicionar"
3. **Editar Etapa**:
   - Clique no ícone de edição (lápis) ao lado da etapa
   - Digite o novo nome
   - Pressione Enter ou clique fora
4. **Remover Etapa**:
   - Clique no ícone de lixeira ao lado da etapa
   - Confirme a remoção
5. **Gerenciar Motivos de Perda**:
   - Clique em "Novo Motivo"
   - Digite o motivo
   - Para remover, clique no ícone de lixeira

### Histórico de Ações
1. Vá em **Configurações** → **Histórico de Ações**
2. Visualize todas as ações em massa realizadas:
   - Importações CSV
   - Exportações
   - Exclusões
   - Atualizações em massa
3. Cada registro mostra:
   - Data/Hora
   - Usuário que realizou a ação
   - Tipo de ação
   - Detalhes (modo de importação, formato, etc.)
   - Quantidade de registros afetados

---

## 🔄 Atualizar dados e log do candidato

### Botão Atualizar
- No **cabeçalho** da área principal há o botão **"Atualizar"**. Use-o para recarregar candidatos, vagas e demais dados do servidor quando quiser ver as informações mais recentes.

### Log de movimentações (perfil do candidato)
- Na **aba Administrativo** do perfil do candidato (`/candidate/[id]/admin`) há a seção **"Log de movimentações"** (visível apenas para administradores). Ela lista data/hora, usuário e descrição de cada ação feita no candidato (mudança de etapa, estrela, candidatura, entrevista, notas etc.).

---

## 🎨 Personalização

### Alternar Tema (Dark/Light)
1. Clique no ícone de sol/lua no canto superior direito
2. O tema será alternado e salvo automaticamente
3. A preferência será mantida em futuras visitas

### Ocultar Menu Lateral
1. No Pipeline, clique no botão para ocultar o menu lateral
2. Clique novamente para exibir

---

## 💡 Dicas e Boas Práticas

### Organização de Dados
- ✅ Use sempre os selects (listas suspensas) ao invés de digitar livremente para manter consistência
- ✅ O sistema normaliza automaticamente cidades, fontes e áreas de interesse
- ✅ Vincule candidatos a vagas específicas quando possível

### Filtros
- ✅ Salve filtros frequentes para uso rápido
- ✅ Use seleção múltipla para filtrar por várias opções ao mesmo tempo
- ✅ Combine múltiplos filtros para encontrar candidatos específicos

### Importação
- ✅ Sempre use o modelo fornecido
- ✅ Revise os vínculos de colunas antes de confirmar
- ✅ Use tags de importação para identificar lotes específicos

### Pipeline
- ✅ Mova candidatos entre etapas arrastando os cards
- ✅ Use o menu de avanço de etapa no formulário para transições rápidas
- ✅ Preencha campos obrigatórios quando solicitado

---

## ⚠️ Funcionalidades em Desenvolvimento

Algumas funcionalidades estão em desenvolvimento e exibem um aviso amarelo (⚠️):
- **Novo Campo Personalizado**: Criar campos customizados
- **Convidar Usuário**: Sistema de convites
- **Novo Template de Email**: Criar templates de email automáticos
- **Edição Completa de Campos**: Edição avançada de propriedades de campos
- **Personalização de Cores do Pipeline**: Alterar cores das colunas do Kanban

---

## 🆘 Problemas Comuns

### Filtros de Período Não Funcionam
- ✅ **Solução**: A coluna "Data de Cadastro" agora está visível na tabela. Verifique se os candidatos têm data de cadastro preenchida.

### Candidato Não Aparece Após Importação
- Verifique se o candidato não foi marcado como duplicado e ignorado
- Verifique os filtros aplicados
- Confira o histórico de ações para ver detalhes da importação

### Não Consigo Criar Vaga Sem Empresa
- Crie a empresa primeiro em **Configurações** → **Empresas/Unidades**
- Ou use o botão "Nova" no próprio formulário de vaga

### Dados Não Estão Normalizados
- O sistema normaliza automaticamente ao salvar
- Se houver dados antigos não normalizados, edite manualmente ou reimporte

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia primeiro
2. Consulte a seção de **Histórico de Ações** para verificar operações recentes
3. Entre em contato com o administrador do sistema

---

**Versão do Guia:** 1.1  
**Última atualização:** Fevereiro 2026





