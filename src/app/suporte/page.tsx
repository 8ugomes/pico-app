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
        <h2 id="support-access">Não consigo entrar</h2>
        <p>Confira o e-mail e a senha e tente novamente em uma conexão estável. O cadastro atual não confirma o e-mail informado e a recuperação por e-mail não está disponível. Sem uma sessão ativa, ainda não existe um caminho automatizado para redefinir a senha.</p>
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
