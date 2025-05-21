# Bonde da Maromba App

Aplicativo para gerenciamento de treinos de musculação, desenvolvido com React Native e Expo, usando Supabase como backend.

## Características

- Autenticação completa (cadastro, login, confirmação de email, recuperação de senha)
- Gerenciamento de planos de treino
- Cadastro e organização de exercícios
- Upload e exibição de imagens para treinos e exercícios
- Acompanhamento de progresso de treinos

## Tecnologias Utilizadas

- React Native
- Expo
- Supabase (Autenticação, Banco de Dados e Armazenamento)
- Formik e Yup para validação de formulários

## Configuração do Ambiente

1. Clone este repositório
2. Instale as dependências
   ```
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase
   ```
   SUPABASE_URL=sua-url-do-supabase
   SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
   ```
4. Execute o aplicativo
   ```
   npm start
   ```

## Estrutura do Banco de Dados

O esquema completo do banco de dados está disponível em `docs/supabase-schema-new.sql` e pode ser executado no Editor SQL do Supabase para configurar todas as tabelas e políticas de segurança.

## Configuração de Storage

Instruções para configuração dos buckets de armazenamento estão disponíveis em `docs/storage-setup.md`.