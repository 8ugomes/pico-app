import Link from 'next/link';
import { PublicPolicyPage } from '@/components/pico/PublicPolicyPage';

export const metadata = { title: 'Diretrizes da comunidade' };

export default function CommunityGuidelinesPage() {
  return (
    <PublicPolicyPage
      title="Diretrizes da comunidade"
      updated="18 de setembro de 2026"
      lead={<p>O Pico existe para aproximar quem vive os esportes de areia. Respeito, contexto e audiência clara mantêm esse encontro seguro.</p>}
    >
      <section aria-labelledby="guidelines-people">
        <h2 id="guidelines-people">Respeite quem está do outro lado</h2>
        <p>Não use o Pico para assediar, ameaçar ou colocar alguém em risco. Não publique informações sensíveis, conversas privadas ou imagens de outra pessoa sem permissão. Discordar não autoriza ataque pessoal.</p>
      </section>

      <section aria-labelledby="guidelines-spam">
        <h2 id="guidelines-spam">Não transforme a conversa em spam</h2>
        <p>Evite conteúdo repetitivo, enganoso ou sem relação com a comunidade em que aparece. O Pico não tem anúncios nem ferramentas para disparos em massa.</p>
      </section>

      <section aria-labelledby="guidelines-audience">
        <h2 id="guidelines-audience">Respeite a audiência escolhida</h2>
        <p>Conteúdo de comunidade privada é para participantes autorizados. Não tente contornar bloqueios ou restrições de acesso. Quem consegue ver uma foto pode copiá-la; pense antes de publicar algo sensível.</p>
        <p>Um jogo salvo é privado até uma ação separada de compartilhamento. Não apresente registro autodeclarado como prova de presença física nem transforme o Pico em sinal de localização ao vivo.</p>
      </section>

      <section aria-labelledby="guidelines-places">
        <h2 id="guidelines-places">Seja claro sobre arenas e comunidades</h2>
        <p>Aparecer no catálogo não significa parceria ou gestão oficial de uma arena. Responsáveis podem solicitar correção, criação ou gestão; participantes não devem se apresentar como representantes sem a função correspondente.</p>
      </section>

      <section aria-labelledby="guidelines-tools">
        <h2 id="guidelines-tools">Denunciar e bloquear</h2>
        <p>Use <strong>Denunciar</strong> no menu de uma pessoa, publicação ou comentário quando houver spam, assédio, risco à segurança ou outro problema. A denúncia fica privada e não remove conteúdo automaticamente.</p>
        <p>Bloquear interrompe a visibilidade entre as duas contas. Você pode revisar e desfazer bloqueios em <Link href="/conta">Privacidade e conta</Link>.</p>
      </section>

      <section aria-labelledby="guidelines-review">
        <h2 id="guidelines-review">Como a análise funciona</h2>
        <p>A operação examina o alvo específico da denúncia, sem acesso geral a comunidades privadas. Ela pode dispensar a denúncia, ocultar o conteúdo ou suspender uma conta; a ação fica auditada. Não há punição automática por volume nem prazo público de resposta configurado.</p>
        <p>Para caminhos fora do aplicativo, consulte <Link href="/suporte">Suporte</Link>.</p>
      </section>
    </PublicPolicyPage>
  );
}
