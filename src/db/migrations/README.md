# Migrações de Banco de Dados

Esta pasta contém arquivos de migração para atualizar o esquema do banco de dados conforme necessário.

## Migrações Disponíveis

### add_order_column_to_exercises.js

Adiciona a coluna `order` à tabela `exercises` para permitir a ordenação dos exercícios dentro de um plano de treino.

Para executar esta migração:

```javascript
import { addOrderColumnToExercises } from './src/db/migrations/add_order_column_to_exercises';

// Em uma função assíncrona
const result = await addOrderColumnToExercises();
console.log(result);
```

## Como Executar Migrações

As migrações podem ser executadas:

1. Manualmente pelo Console do Supabase
2. Via código usando as funções exportadas
3. Durante a inicialização do aplicativo (recomendado apenas em ambiente de desenvolvimento) 