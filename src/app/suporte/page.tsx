import Link from 'next/link';
import { PublicPolicyPage } from '@/components/pico/PublicPolicyPage';

export const metadata = { title: 'Suporte' };

export default function SupportPage() {
  const privacyContact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT;

  return (
    <PublicPolicyPage
      title="Suporte do Pico"
      updated="18 de setembro de 2026"
      lead={<p>Comece pelos controles do próprio Pico. O canal público de suporte ainda não foi configurado; esta página não inventa um e-mail ou prazo de resposta.</p>}
    >
      <section aria-labelledby="support-access">
        <h2 id="support-access">Esqueci minha senha</h2>
        <ol>
          <li>Na tela <Link href="/login">Entrar</Link>, toque em <strong>Esqueci minha senha</strong> ou abra <Link href="/recuperar">Recuperar acesso</Link>.</li>
          <li>Informe o e-mail da sua conta e peça o link.</li>
          <li>Abra o e-mail no mesmo navegador em que fez o pedido. Confira também o spam.</li>
          <li>Escolha uma senha nova, com pelo menos 12 caracteres. Ao salvar, o Pico encerra as sessões e você entra de novo.</li>
        </ol>
        <p>O link é individual e expira. Se ele não funcionar, peça outro e use sempre o mais recente.</p>
      </section>

      <section aria-labelledby="support-access-limits">
        <h2 id="support-access-limits">O e-mail não chegou</h2>
        <p>Durante a beta o envio de e-mails ainda está em teste e pode não alcançar todas as contas. Se o link não chegar em alguns minutos, a recuperação por e-mail não vai funcionar para o seu endereço agora. Não existe atendimento automático para trocar senha por mensagem.</p>
        <p>Contas suspensas ou revogadas mostram o estado de acesso sem liberar o conteúdo social.</p>
      </section>

      <section aria-labelledby="support-safety">
        <h2 id="support-safety">Conteúdo ou pessoa inadequada</h2>
        <p>Abra o menu da pessoa, publicação ou comentário para denunciar ou bloquear. A denúncia registra o item exato para análise; bloquear interrompe a visibilidade entre as contas. Veja o que esperar nas <Link href="/diretrizes">Diretrizes da comunidade</Link>.</p>
      </section>

      <section aria-labelledby="support-account">
        <h2 id="support-account">Conta, dados e exclusão</h2>
        <p>Em <Link href="/conta">Privacidade e conta</Link>, você pode baixar os dados, revisar bloqueios e denúncias, remover fotos sem uso e excluir a conta com confirmação de senha. Se estiver com acesso suspenso, essas ações também aparecem em Acesso ao Pico.</p>
        <p>Para entender o que é armazenado e os limites de remoção, consulte a <Link href="/privacidade">Política de privacidade</Link>.</p>
      </section>

      <section aria-labelledby="support-problem">
        <h2 id="support-problem">Quando algo não funcionar</h2>
        <p>Preserve o texto ou a foto que ainda não foi enviada, confira a conexão e tente a ação novamente. Não envie a mesma publicação repetidas vezes se o resultado estiver em dúvida.</p>
        <p>Quando o canal público for definido, informe a tela em que o problema ocorreu, o que você tentou fazer e a versão do aplicativo. Não envie senha, token de acesso ou conteúdo privado que não seja necessário para entender o problema.</p>
      </section>

      <section aria-labelledby="support-contact">
        <h2 id="support-contact">Contato</h2>
        <p>O canal público de suporte ainda não foi configurado.</p>
        {privacyContact
          ? <p>Para assuntos de privacidade, use o contato publicado: {privacyContact}</p>
          : <p>O contato de privacidade também está pendente. As ações disponíveis na conta continuam funcionando no aplicativo.</p>}
      </section>
    </PublicPolicyPage>
  );
}
