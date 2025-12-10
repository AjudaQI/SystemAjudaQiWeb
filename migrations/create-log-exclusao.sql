-- Criar tabela de log de exclusões de dúvidas
CREATE TABLE IF NOT EXISTS logexclusaoduvida (
  log_id SERIAL PRIMARY KEY,
  log_idduvida INTEGER NOT NULL,
  log_titulo TEXT NOT NULL,
  log_descricao TEXT NOT NULL,
  log_idusuario_autor BIGINT NOT NULL,
  log_nome_autor TEXT NOT NULL,
  log_idusuario_deletou BIGINT NOT NULL,
  log_nome_deletou TEXT NOT NULL,
  log_email_deletou TEXT NOT NULL,
  log_matricula_deletou TEXT,
  log_data_exclusao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_log_exclusao_duvida ON logexclusaoduvida(log_idduvida);
CREATE INDEX IF NOT EXISTS idx_log_exclusao_usuario_deletou ON logexclusaoduvida(log_idusuario_deletou);
CREATE INDEX IF NOT EXISTS idx_log_exclusao_data ON logexclusaoduvida(log_data_exclusao DESC);
