import Link from 'next/link';
import { PublicPolicyPage } from '@/components/pico/PublicPolicyPage';

export const metadata = { title: 'Termos de uso' };

export default function TermsPage() {
  return (
    <PublicPolicyPage
      title="Termos de uso do Pico"
      updated="18 de setembro de 2026"
      lead={<p>Estas condições descrevem o serviço que existe hoje e os cuidados necessários para usar o Pico. A identificação jurídica do responsável e o canal público de contato ainda precisam ser configurados antes da abertura externa.</p>}
    >
      <section aria-labelledby="terms-service">
        <h2 id="terms-service">O que é o Pico</h2>
        <p>O Pico é uma rede social para praticantes de futevôlei, beach tennis e vôlei de praia. Perfis, arenas, comunidades e publicações ajudam pessoas a se encontrar em torno da areia. Reservas, pagamentos, anúncios, ranking avançado e presença ao vivo não fazem parte do serviço atual.</p>
        <p>O acesso social depende de uma conta ativa e da admissão vigente. Comunidades privadas e funções de gestão têm permissões próprias. Uma demonstração identificada funciona só no aparelho e não representa cadastro, presença ou atividade de pessoas reais.</p>
      </section>

      <section aria-labelledby="terms-account">
        <h2 id="terms-account">Conta e acesso</h2>
        <p>O cadastro atual usa e-mail e senha, sem confirmação de e-mail. O endereço informado é autodeclarado e não comprova titularidade. A recuperação por e-mail não está disponível porque o serviço não usa SMTP nesta etapa.</p>
        <p>Não compartilhe sua senha. Contas suspensas, revogadas ou com exclusão solicitada não recuperam acesso por um novo cadastro.</p>
      </section>

      <section aria-labelledby="terms-content">
        <h2 id="terms-content">Conteúdo e audiência</h2>
        <p>Você escolhe a audiência e os destinos disponíveis antes de publicar. Conteúdo de comunidade privada continua restrito aos participantes autorizados. Republicar preserva o autor e a audiência do original.</p>
        <p>Jogos são registros privados. Compartilhar um jogo cria uma publicação separada; corrigir ou excluir o registro não altera essa publicação. Ao publicar texto, foto ou vídeo, use somente conteúdo que você possa compartilhar e preserve a privacidade de outras pessoas.</p>
        <p>Você continua titular do conteúdo que envia e autoriza o Pico, enquanto ele estiver disponível, a armazenar, processar e exibir esse conteúdo somente para operar o serviço e respeitar a audiência escolhida. Essa autorização não transfere autoria nem permite publicidade. Você pode remover o conteúdo pelos controles disponíveis, observados os limites descritos na Política de privacidade.</p>
      </section>

      <section aria-labelledby="terms-conduct">
        <h2 id="terms-conduct">Convivência e moderação</h2>
        <p>Use o Pico de acordo com as <Link href="/diretrizes">Diretrizes da comunidade</Link>. É possível denunciar pessoas, publicações e comentários e bloquear outra pessoa. A operação pode examinar o item denunciado, dispensar a denúncia, ocultar conteúdo ou suspender acesso. Essas medidas ficam registradas e não são aplicadas automaticamente pela quantidade de denúncias.</p>
      </section>

      <section aria-labelledby="terms-control">
        <h2 id="terms-control">Seu controle</h2>
        <p>Você pode editar o perfil, remover conteúdo próprio, desfazer conexões, corrigir ou excluir jogos e baixar uma cópia dos dados da conta. Também pode excluir sua conta com confirmação de senha. Arenas e comunidades geridas podem permanecer sob custódia ou responsabilidade transferida para preservar o recurso coletivo.</p>
        <p>Consulte a <Link href="/privacidade">Política de privacidade</Link> para entender dados, audiência, fornecedores e limites de exclusão.</p>
      </section>

      <section aria-labelledby="terms-beta">
        <h2 id="terms-beta">Beta e alterações</h2>
        <p>O Pico está em preparação para distribuição. Não há prazo público de atendimento nem garantia operacional divulgada. A identificação jurídica, a política para menores e esta redação precisam de aprovação do responsável antes da abertura externa. Recursos e estas condições podem ser ajustados conforme o serviço evolui; a data no início desta página identifica a versão publicada.</p>
        <p>A página de <Link href="/suporte">Suporte</Link> reúne os caminhos disponíveis e deixa explícito o que ainda depende de configuração.</p>
      </section>
    </PublicPolicyPage>
  );
}
