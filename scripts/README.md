# Scripts de Versionamento

## Sistema de Versionamento Automático

Este projeto possui um sistema de versionamento automático que incrementa a versão a cada commit.

### Como Funciona

1. **Hook Pre-commit**: Antes de cada commit, o hook `pre-commit` é executado automaticamente
2. **Incremento de Versão**: O script `bump-version.js` incrementa o patch version (último número)
   - Exemplo: `0.1.0` → `0.1.1` → `0.1.2`
3. **Criação de Tag Git**: Uma tag Git anotada é criada automaticamente com o formato `v{versão}`
   - Exemplo: `v0.1.1`, `v0.1.2`
4. **Commit Automático**: O `package.json` modificado é automaticamente adicionado ao commit
5. **Exibição na Aplicação**: A versão atual é exibida no sidebar da aplicação para os usuários

### Instalação

Após clonar o repositório, execute:

```bash
npm install
```

O script `prepare` no `package.json` irá instalar automaticamente os git hooks do Husky.

### Uso Manual

Se precisar incrementar a versão manualmente (sem fazer commit), execute:

```bash
npm run bump-version
```

### Formato de Versão

O sistema usa o formato **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

Atualmente, apenas o **PATCH** é incrementado automaticamente. Para incrementar MAJOR ou MINOR, edite manualmente o `package.json`.

### Tags Git

O sistema cria automaticamente tags Git anotadas a cada incremento de versão. Para enviar as tags para o repositório remoto:

```bash
git push origin --tags
```

Ou para enviar uma tag específica:

```bash
git push origin v0.1.1
```

### Exibição da Versão na Aplicação

A versão atual é exibida automaticamente no footer do sidebar da aplicação. A versão é carregada dinamicamente através do endpoint `/api/version` e atualizada automaticamente quando a aplicação é atualizada.

### Desabilitar Temporariamente

Se precisar fazer um commit sem incrementar a versão, use:

```bash
git commit --no-verify
```

⚠️ **Atenção**: Use com cuidado, pois isso pula todos os hooks, incluindo possíveis validações.

