#!/usr/bin/env node

/**
 * Script para incrementar automaticamente a versão no package.json
 * Incrementa o patch version (0.1.0 -> 0.1.1 -> 0.1.2, etc)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  // Ler o package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Obter a versão atual
  const currentVersion = packageJson.version;
  const versionParts = currentVersion.split('.').map(Number);
  
  // Incrementar o patch version (último número)
  versionParts[2] = (versionParts[2] || 0) + 1;
  
  // Garantir que temos 3 partes (major.minor.patch)
  while (versionParts.length < 3) {
    versionParts.push(0);
  }
  
  // Construir nova versão
  const newVersion = versionParts.join('.');
  const tagName = `v${newVersion}`;
  
  // Atualizar o package.json
  packageJson.version = newVersion;
  
  // Escrever de volta no arquivo
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
  );
  
  console.log(`✓ Versão incrementada: ${currentVersion} → ${newVersion}`);
  
  // Criar tag Git (apenas se estiver em um repositório Git)
  try {
    // Verificar se estamos em um repositório Git
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Verificar se a tag já existe
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' });
      console.log(`⚠ Tag ${tagName} já existe. Pulando criação de tag.`);
    } catch (tagError) {
      // Tag não existe, criar nova tag
      try {
        execSync(`git tag -a ${tagName} -m "Versão ${newVersion}"`, { stdio: 'inherit' });
        console.log(`✓ Tag Git criada: ${tagName}`);
      } catch (tagCreateError) {
        console.warn(`⚠ Aviso: Não foi possível criar a tag Git: ${tagCreateError.message}`);
        console.warn(`   Você pode criar manualmente com: git tag -a ${tagName} -m "Versão ${newVersion}"`);
      }
    }
  } catch (gitError) {
    // Não é um repositório Git ou git não está disponível
    console.log(`ℹ Não é um repositório Git ou git não está disponível. Tag não criada.`);
  }
  
  // Retornar a nova versão para uso em outros scripts
  process.exit(0);
} catch (error) {
  console.error('Erro ao incrementar versão:', error.message);
  process.exit(1);
}

