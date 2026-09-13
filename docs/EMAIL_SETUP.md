# E-mails do Pico — configuração pendente

Em 13/09/2026 o responsável confirmou que ainda não tem domínio próprio nem provedor SMTP. Não há credenciais a configurar nesta rodada. Não divulgar cadastro aberto antes de concluir a validação abaixo.

Proposta: usar Resend como SMTP do Supabase Auth. A [integração oficial](https://resend.com/docs/send-with-supabase-smtp) exige domínio verificado e uma chave do provedor. O domínio precisa pertencer ao responsável; não foi comprado, reservado nem escolhido automaticamente. O endereço `pico-app-sepia.vercel.app` continua sendo a aplicação; ele não concede controle de DNS para configurar remetentes de e-mail.

1. Registrar o domínio escolhido e criar uma conta no provedor. Custos e contratação ficam para o responsável.
2. No Resend, adicionar o domínio/subdomínio de envio e publicar os registros DNS solicitados pelo provedor. Esperar a verificação. Definir remetente e endereço de suporte reais; não usar um endereço inventado.
3. No projeto Supabase principal, ir a Authentication → Email → SMTP Settings. Configurar host `smtp.resend.com`, porta `465`, usuário `resend`, senha igual à chave de envio do Resend, nome `Pico` e remetente no domínio verificado. Inserir a chave diretamente no provedor, nunca em conversa, Git ou variável `NEXT_PUBLIC_*`.
4. Preservar confirmação de e-mail. Revisar limite de envio conforme a capacidade contratada. Manter URLs de retorno exatas em `config/environments.json`, sem curingas. Templates atuais usam confirmação/recuperação; `scripts/configure-auth.mjs` prepara o diff de origens/templates. O fluxo padrão exige o mesmo navegador; ativar o template alternativo somente após conferir os links efetivamente enviados.
5. Com duas caixas de teste controladas pelo responsável, validar cadastro, entrega e spam, confirmação, reenvio, link antigo, login, recuperação, senha antiga negada e senha nova válida. Repetir no Safari/iPhone e Chrome/Android e verificar o comportamento ao abrir pelo app de e-mail. Não marcar esses testes como feitos apenas por gerar tokens administrativos.

Nenhuma compra, criação de conta em provedor ou alteração de DNS foi realizada. A política de senhas já tem script separado e não contém credenciais SMTP.
