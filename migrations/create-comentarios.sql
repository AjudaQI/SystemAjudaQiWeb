-- Criar tabela de comentários para respostas
CREATE TABLE IF NOT EXISTS comentario (
  com_idcomentario SERIAL PRIMARY KEY,
  com_idresposta INTEGER NOT NULL,
  com_idusuario BIGINT NOT NULL,
  com_texto TEXT NOT NULL,
  com_datacomentario TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comentario_resposta FOREIGN KEY (com_idresposta) REFERENCES resposta(res_idresposta) ON DELETE CASCADE,
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (com_idusuario) REFERENCES usuario(usu_id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_comentario_resposta ON comentario(com_idresposta);
CREATE INDEX IF NOT EXISTS idx_comentario_usuario ON comentario(com_idusuario);
CREATE INDEX IF NOT EXISTS idx_comentario_data ON comentario(com_datacomentario DESC);
