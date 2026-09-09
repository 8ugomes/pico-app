import type { ReadErrorCode } from '../../types/read';
export const readMessages: Record<ReadErrorCode, string> = {
  configuration: 'Não foi possível conectar o Pico. A configuração do serviço precisa ser revisada.',
  authentication: 'Entre na sua conta para continuar.',
  profile_missing: 'Sua conta está ativa, mas seu perfil ainda não foi encontrado.',
  not_found: 'Essa arena não foi encontrada ou não está disponível.',
  unavailable: 'Não foi possível carregar agora. Confira sua conexão e tente novamente.',
  invalid_request: 'Não foi possível abrir esse conteúdo.',
};
export class ReadError extends Error {
  code: ReadErrorCode;
  status: number;
  constructor(code: ReadErrorCode, status = 503) { super(readMessages[code]); this.code = code; this.status = status; }
}
