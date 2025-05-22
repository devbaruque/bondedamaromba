# Especificação Técnica: Bonde da Maromba

## 📱 Visão Geral do Projeto

O **Bonde da Maromba** é um aplicativo mobile desenvolvido em React Native e Supabase, focado em gerenciar treinos de academia. O conceito principal é uma "To Do List" especializada para exercícios físicos, com foco em excelente experiência do usuário e design consistente.

## 🏗️ Arquitetura do Sistema

### Tecnologias Base
- **Frontend**: React Native (JavaScript)
- **Backend**: Supabase (PostgreSQL + APIs RESTful + Realtime)
- **Estilização**: NativeWind (Tailwind CSS para React Native)
- **Gerenciamento de Estado**: Context API + React Query
- **Navegação**: React Navigation v6
- **Formulários**: Formik + Yup

### Estrutura de Diretórios
```
/src
├── assets/             # Imagens, fontes e recursos estáticos
├── components/         # Componentes reutilizáveis
│   ├── ui/             # Componentes de UI básicos (Design System)
│   └── features/       # Componentes específicos de features
├── constants/          # Constantes da aplicação
├── design/             # Design System
│   ├── colors.js       # Paleta de cores
│   ├── typography.js   # Configurações de tipografia
│   └── spacing.js      # Sistema de espaçamento
├── hooks/              # Hooks customizados
├── navigation/         # Configuração de navegação
├── screens/            # Telas da aplicação
├── services/           # Serviços externos (Supabase, etc)
│   ├── api/            # Funções de API
│   ├── auth/           # Serviços de autenticação
│   └── storage/        # Gerenciamento de Storage
├── store/              # Gerenciamento de estado global
├── types/              # Definições de tipos
└── utils/              # Funções utilitárias
```

## 🎨 Design System

### Paleta de Cores
- **Primária**: Azul marinho (#1A2A40)
- **Secundária**: Verde musgo (#465E52)
- **Terciária**: Cinza grafite (#2D3142)
- **Background**: Tons de cinza escuro (#121212, #1E1E1E)
- **Texto**: Branco (#FFFFFF), Cinza claro (#E0E0E0)
- **Feedbacks**: Sucesso (#4CAF50), Erro (#F44336), Alerta (#FF9800)

### Tipografia
- **Família**: Roboto (principal), Montserrat (títulos)
- **Tamanhos**:
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 30px
- **Pesos**:
  - regular: 400
  - medium: 500
  - semibold: 600
  - bold: 700

### Componentes Base
1. **Button**
   - Variantes: primary, secondary, outline, text
   - Estados: default, pressed, disabled, loading
   - Tamanhos: sm, md, lg

2. **Input**
   - Variantes: default, password, textarea
   - Estados: default, focused, error, disabled
   - Propriedades: label, hint, errorMessage

3. **Card**
   - Variantes: default, elevated, flat
   - Propriedades: padding, radius, shadow

4. **Avatar**
   - Tamanhos: sm, md, lg
   - Variantes: image, initials, icon

5. **Modal**
   - Variantes: bottom-sheet, center, fullscreen
   - Propriedades: title, closeButton, content

## 🗄️ Modelo de Dados (Supabase)

### Tabela: users
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único (gerado pelo auth.users) |
| email | text | Email do usuário |
| full_name | text | Nome completo |
| avatar_url | text | URL da imagem de perfil |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

### Tabela: workout_plans
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| user_id | uuid | Referência ao usuário |
| name | text | Nome do treino (A, B, FullBody, etc) |
| description | text | Descrição do treino |
| image_url | text | URL da imagem de capa |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

### Tabela: exercises
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| workout_plan_id | uuid | Referência ao plano de treino |
| name | text | Nome do exercício |
| sets | integer | Número de séries |
| repetitions | integer | Número de repetições |
| rest_time | integer | Tempo de descanso (segundos) |
| notes | text | Observações opcionais |
| order | integer | Ordem do exercício no treino |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

### Tabela: exercise_images
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| exercise_id | uuid | Referência ao exercício |
| image_url | text | URL da imagem |
| order | integer | Ordem da imagem na galeria |
| created_at | timestamp | Data de criação |

### Tabela: workout_history
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| user_id | uuid | Referência ao usuário |
| workout_plan_id | uuid | Referência ao plano de treino |
| start_time | timestamp | Hora de início |
| end_time | timestamp | Hora de término |
| created_at | timestamp | Data de criação |

### Tabela: exercise_logs
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| workout_history_id | uuid | Referência ao histórico de treino |
| exercise_id | uuid | Referência ao exercício |
| completed | boolean | Se foi finalizado |
| completed_sets | integer | Número de séries completadas |
| created_at | timestamp | Data de criação |

## 🔐 Autenticação e Segurança

### Fluxo de Autenticação
1. **Cadastro**:
   - Validação de formato de email e força da senha (mínimo 8 caracteres, com números e letras)
   - Armazenamento seguro via Supabase Auth
   - Criação automática de registro na tabela `users`

2. **Login**:
   - Email e senha com validação de campos
   - Feedback visual de loading e erros
   - Token JWT armazenado em AsyncStorage com RefreshToken

3. **Persistência**:
   - Verificação de sessão no inicialização do app
   - Refresh automático de token expirado
   - Logout com limpeza de tokens

### Políticas RLS (Row Level Security)
- Cada tabela terá políticas para que usuários só possam ver e editar seus próprios dados
- Exemplo para tabela `workout_plans`:
  ```sql
  CREATE POLICY "Usuários podem ver apenas seus próprios treinos"
  ON workout_plans 
  FOR SELECT USING (auth.uid() = user_id);
  
  CREATE POLICY "Usuários podem criar seus próprios treinos"
  ON workout_plans 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  ```

## 📱 Telas e Fluxos

### 1. Autenticação
- **Login**:
  - Logo e nome do app centralizado
  - Campo de email (validação de formato)
  - Campo de senha (toggle para mostrar/esconder)
  - Botão de login com estado de loading
  - Link para cadastro
  - Exibição de erros inline

- **Cadastro**:
  - Logo e nome do app centralizado
  - Campo de nome completo
  - Campo de email (validação de formato)
  - Campo de senha (com indicador de força)
  - Confirmação de senha
  - Botão de cadastro com estado de loading
  - Link para voltar ao login

### 2. Seleção de Treino
- Header com nome do app e avatar/menu do usuário
- ScrollView horizontal com cards de treino
- Cada card terá:
  - Imagem de fundo com overlay
  - Nome do treino (A, B, C, FullBody, etc)
  - Contador de exercícios
- Botão flutuante para adicionar novo treino
- Pull-to-refresh para atualizar lista

### 3. Exercícios do Treino
- Header com nome do treino e botão de voltar
- FlatList vertical com cards de exercícios
- Cada card terá:
  - Carousel de imagens (ScrollView horizontal)
  - Nome do exercício
  - Indicadores de séries e repetições
  - Botão para marcar como concluído
- Botão flutuante para adicionar novo exercício
- Menu de opções para editar/excluir treino

### 4. Detalhes do Exercício
- Header com nome do exercício e botão de voltar
- Imagem principal do exercício
- Descrição do exercício (se houver)
- Lista de séries com checkboxes
- Timer para descanso com:
  - Display digital do tempo
  - Botões play/pause/reset
  - Vibração ao finalizar
- Botão para marcar todas as séries como concluídas
- Botão para editar exercício

### 5. Edição de Exercício
- Form com:
  - Upload de imagens (galeria ou câmera)
  - Campo de nome
  - Campo numérico para séries
  - Campo numérico para repetições
  - Campo numérico para tempo de descanso
  - Campo de texto para observações
  - Botões de salvar e cancelar
  - Botão de excluir (com confirmação)

### 6. Histórico de Treinos
- Calendário superior (react-native-calendars)
  - Dias com treino marcados
  - Seleção de intervalo para filtro
- Lista de treinos realizados agrupados por data
- Cada item mostra:
  - Nome do treino
  - Hora de início e duração
  - Porcentagem de exercícios concluídos
- Filtros por semana/mês
- Estatísticas básicas (treinos por semana, etc)

## ⚙️ Roadmap de Desenvolvimento

### Fase 1: Fundação (2-3 semanas)
- [x] Setup do projeto React Native
- [x] Configuração do ESLint, Prettier
- [x] Integração com Supabase
- [x] Implementação do Design System base
- [x] Telas de Login e Cadastro
- [x] Navegação básica
- [x] Persistência de sessão

### Fase 2: Gerenciamento de Treinos (2-3 semanas)
- [x] Modelagem do banco no Supabase
- [x] Implementação das políticas RLS
- [x] Tela de Seleção de Treinos
- [x] CRUD de treinos
- [x] Tela de lista de exercícios (visualização)
- [x] Layout base das telas principais

### Fase 3: Funcionalidades de Exercícios (3-4 semanas)
- [x] CRUD completo de exercícios
- [x] Upload de imagens para Storage do Supabase
- [x] Funcionalidade de marcação de séries
- [x] Timer para descanso com notificações
- [x] Sistema de progresso do treino
- [x] Tela detalhada do exercício

### Fase 4: Histórico e Refinamento (2-3 semanas)
- [x] Registro de histórico de treinos
- [x] Implementação do calendário e filtros
- [ ] Testes de usabilidade
- [ ] Otimizações de performance

### Fase 5: Preparação para Produção (1-2 semanas)
- [ ] Testes finais em diferentes dispositivos
- [ ] Configuração de ambiente de produção
- [ ] Preparação de assets para lojas
- [ ] Documentação final
- [ ] Lançamento v1.0

## 📊 Estratégia de Testes

### Testes Unitários
- **Jest** para testes de lógica e utilitários
- **React Native Testing Library** para componentes
- Mocks para serviços do Supabase

### Testes de Integração
- Testar fluxos completos entre telas
- Validar integrações com Supabase

### Testes Manuais
- Checklist de funcionalidades em diferentes dispositivos
- Teste de responsividade
- Teste de acessibilidade básica

## 🚀 Estratégia de Implantação

### Ambiente de Desenvolvimento
- Supabase local ou projeto de desenvolvimento
- Variáveis de ambiente separadas
- Dados fictícios para testes

### Ambiente de Produção
- Projeto Supabase em produção
- Backups automáticos do banco de dados
- Monitoramento de erros com Sentry

### CI/CD
- GitHub Actions para testes automatizados
- Builds automáticos para distribuição interna
- Processo de deploy para lojas de aplicativos

## 📈 Escalabilidade Futura

### Recursos Planejados para v2.0
- Mudança de tema dark/light
- Push notifications para lembretes
- Compartilhamento social de treinos
- Integração com wearables
- Gráficos de progresso
- Importação/exportação de treinos

### Otimizações Técnicas
- Implementação de offline-first com sincronização
- Cache de imagens e dados frequentes
- Lazy loading para melhorar performance
- Redução de bundle size

## 📝 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase
- **Funções/Hooks**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Arquivos de componente**: PascalCase.jsx
- **Arquivos utilitários**: camelCase.js

### Commits
- Seguir padrão Conventional Commits:
  - feat: Nova funcionalidade
  - fix: Correção de bug
  - docs: Documentação
  - style: Formatação
  - refactor: Refatoração
  - test: Testes
  - chore: Manutenção

### Pull Requests
- Template com descrição da mudança
- Checklist de testes
- Screenshots/vídeos (se aplicável)
- Reviewer obrigatório

## 🛠️ Ferramentas Recomendadas

### Desenvolvimento
- **VSCode** com extensões para React Native
- **Insomnia/Postman** para testar APIs
- **Supabase CLI** para migrações de banco
- **React Native Debugger** para debug

### UI/UX
- **Figma** para mockups e design system
- **Storybook** para documentação de componentes

### Monitoramento
- **Sentry** para rastreamento de erros
- **Firebase Analytics** para métricas de uso

---

## 📝 Notas Adicionais

Este documento serve como guia completo para o desenvolvimento do Bonde da Maromba. À medida que o projeto evolui, atualizações podem ser necessárias. Cada desenvolvedor deve seguir as diretrizes aqui estabelecidas para manter consistência e qualidade no código. 