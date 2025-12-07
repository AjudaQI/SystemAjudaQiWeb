# Configuração do Sistema de Versionamento

## Para Novos Desenvolvedores

Quando você clonar o repositório e executar `npm install`, o sistema de versionamento será configurado automaticamente através do script `prepare` no `package.json`.

### Passos Iniciais

1. Clone o repositório
2. Execute:
   ```bash
   npm install
   ```
3. Pronto! O Husky será instalado automaticamente e os hooks Git estarão ativos

## Como Funciona

### Git Hooks são Universais

Os hooks do Git funcionam **independentemente da IDE** que você usa:
- ✅ Cursor
- ✅ VS Code
- ✅ IntelliJ IDEA
- ✅ GitKraken
- ✅ Linha de comando
- ✅ Qualquer outra ferramenta Git

**Por quê?** Os hooks são executados pelo próprio Git, não pela IDE. Quando você faz um commit (seja pela IDE ou linha de comando), o Git executa os hooks automaticamente.

### O que Acontece ao Fazer Commit

1. Você faz commit pela sua IDE ou linha de comando
2. O Git detecta o hook `pre-commit` em `.husky/pre-commit`
3. O hook executa automaticamente:
   - Incrementa a versão no `package.json`
   - Cria uma tag Git
   - Adiciona o `package.json` modificado ao commit
4. O commit prossegue normalmente

### Se Algo Der Errado

Se o hook não executar (raro, mas pode acontecer), você verá uma mensagem de erro no commit. Nesse caso:

1. Execute manualmente:
   ```bash
   npm run bump-version
   git add package.json
   git commit --amend
   ```

2. Ou pule o hook (não recomendado):
   ```bash
   git commit --no-verify
   ```

## Verificação

Para verificar se os hooks estão configurados:

```bash
# Verificar se o diretório .husky existe
ls .husky

# Verificar se o hook pre-commit existe
cat .husky/pre-commit

# Testar manualmente o incremento de versão
npm run bump-version
```

## Troubleshooting

### Hook não executa

1. Verifique se o Husky foi instalado:
   ```bash
   npm run prepare
   ```

2. Verifique se o arquivo `.husky/pre-commit` tem permissão de execução (Linux/Mac):
   ```bash
   chmod +x .husky/pre-commit
   ```

### Erro ao criar tag Git

Se você não estiver em um repositório Git ou o Git não estiver disponível, o script continuará funcionando, mas não criará a tag. Isso é normal e não impede o commit.

## Notas Importantes

- ⚠️ **Nunca faça commit com `--no-verify`** a menos que seja absolutamente necessário
- ✅ O `package.json` modificado será incluído automaticamente no commit
- ✅ As tags Git são criadas localmente - você precisa fazer push manualmente:
  ```bash
  git push origin --tags
  ```

