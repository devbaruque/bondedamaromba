# Configuração de Buckets no Supabase

## Passo a Passo para Criar Buckets no Supabase

### Bucket 1: workout-images

1. **Acesse o Dashboard do Supabase**
   - Entre na sua conta Supabase e selecione o projeto do Bonde da Maromba

2. **Navegue até Storage**
   - No menu lateral esquerdo, clique em "Storage"

3. **Crie o primeiro bucket**
   - Clique no botão "Create new bucket" ou "New bucket"
   - No campo "Name", digite: `workout-images` (usando hífen, não underscore)
   - Marque a opção "Public bucket" para permitir acesso público às imagens
   - Nas opções avançadas, defina:
     - Cache-Control: `max-age=3600` (1 hora de cache)
   - Clique em "Create" ou "Save" para finalizar

### Bucket 2: exercise-images

1. **Ainda na seção Storage**
   - Clique novamente em "Create new bucket" ou "New bucket"
   - No campo "Name", digite: `exercise-images` (usando hífen, não underscore)
   - Marque a opção "Public bucket" para permitir acesso público às imagens
   - Nas opções avançadas, defina:
     - Cache-Control: `max-age=3600` (1 hora de cache)
   - Clique em "Create" ou "Save" para finalizar

## Configurar Políticas de Acesso (RLS)

Para cada bucket, você precisa configurar as políticas de segurança:

1. **Selecione o bucket** (workout-images ou exercise-images)

2. **Vá para a aba "Policies"**
   - Clique no botão "New Policy" ou "Add Policy"

3. **Para workout-images, crie as seguintes políticas:**
   
   a. **Política para leitura pública:**
   - Policy name: `Permitir leitura pública`
   - Policy definition: `SELECT`
   - Allowed operations: `SELECT`
   - Using expression: `true`
   - Clique em "Save Policy"
   
   b. **Política para upload (usuários autenticados):**
   - Policy name: `Usuários autenticados podem fazer upload`
   - Policy definition: `INSERT`
   - Allowed operations: `INSERT`
   - Using expression: `auth.role() = 'authenticated'`
   - Clique em "Save Policy"
   
   c. **Política para exclusão (próprio usuário):**
   - Policy name: `Usuários podem excluir suas próprias imagens`
   - Policy definition: `DELETE`
   - Allowed operations: `DELETE`
   - Using expression: `auth.uid() = owner`
   - Clique em "Save Policy"

4. **Repita o mesmo processo para o bucket "exercise-images"**

## Observação Importante

Os nomes dos buckets foram alterados de `workout_images` para `workout-images` e de `exercise_images` para `exercise-images` para atender à regra de nomenclatura do Supabase, que permite apenas letras minúsculas, números, pontos e hifens.

O código da aplicação foi atualizado para usar os novos nomes de buckets com hífen. 