import type { DemoSeed } from "../types/social";

const minute = 60_000;
// All names, places, attendance and activity are fictional.
// Times are offsets from the start of the demo, not production timestamps.
export const mock: DemoSeed = {
  currentUserId: "rafa",
  sports: [
    { id: "futevolei", name: "Futevôlei", shortName: "Futevôlei" },
    { id: "beach-tennis", name: "Beach Tennis", shortName: "Beach tennis" },
    { id: "volei-praia", name: "Vôlei de Praia", shortName: "Vôlei" },
  ],
  players: [
    { id: "rafa", username: "rafacosta", name: "Rafa Costa", bio: "Um último jogo e eu vou. Sempre tem mais um. ☀", neighborhood: "Pinheiros", avatar: 0, sports: [{ sportId: "futevolei", level: "Intermediário" }, { sportId: "volei-praia", level: "Iniciante" }], arenaIds: ["vila", "alto"], available: true },
    { id: "marina", username: "marinaalves", name: "Marina Alves", bio: "Futevôlei no fim do dia e boas resenhas depois.", neighborhood: "Vila Madalena", avatar: 1, sports: [{ sportId: "futevolei", level: "Intermediário" }, { sportId: "beach-tennis", level: "Iniciante" }], arenaIds: ["vila"], available: true },
    { id: "lucas", username: "lucasmelo", name: "Lucas Melo", bio: "Na areia desde 2019. Bora fechar um quarteto?", neighborhood: "Pinheiros", avatar: 2, sports: [{ sportId: "volei-praia", level: "Avançado" }, { sportId: "futevolei", level: "Intermediário" }], arenaIds: ["vila", "alto"], available: true },
    { id: "bia", username: "bianakamura", name: "Bia Nakamura", bio: "Beach tennis, um café e a cidade inteira pela frente.", neighborhood: "Moema", avatar: 3, sports: [{ sportId: "beach-tennis", level: "Intermediário" }], arenaIds: ["ipanema"], available: true },
    { id: "pedro", username: "pedrolima", name: "Pedro Lima", bio: "Aprendendo um pouco a cada rally. Jogo pela turma.", neighborhood: "Alto de Pinheiros", avatar: 4, sports: [{ sportId: "beach-tennis", level: "Iniciante" }, { sportId: "volei-praia", level: "Intermediário" }], arenaIds: ["alto", "ipanema"], available: false },
    { id: "julia", username: "juliaramos", name: "Júlia Ramos", bio: "Levantadora oficial dos jogos e dos rolês.", neighborhood: "Vila Mariana", avatar: 5, sports: [{ sportId: "volei-praia", level: "Intermediário" }], arenaIds: ["vila", "ipanema"], available: true },
  ],
  arenas: [
    { id: "vila", slug: "areia-da-vila", name: "Areia da Vila", neighborhood: "Vila Madalena", city: "São Paulo", description: "Um respiro de areia no meio da cidade. Futevôlei no fim da tarde, vôlei com a turma e aquela resenha que faz ficar mais um pouco.", sports: ["futevolei", "volei-praia"], members: 128, image: "/images/urban-court.webp", imagePosition: "50% 58%", amenities: ["Duchas", "Vestiário", "Espaço de convivência"] },
    { id: "alto", slug: "alto-da-areia", name: "Alto da Areia", neighborhood: "Alto de Pinheiros", city: "São Paulo", description: "Uma comunidade de quem gosta de começar cedo e de receber gente nova. Tem espaço para aprender e para encontrar sua próxima dupla.", sports: ["beach-tennis", "volei-praia", "futevolei"], members: 86, image: "/images/urban-court.webp", imagePosition: "15% 45%", amenities: ["Iluminação", "Bicicletário", "Vestiário"] },
    { id: "ipanema", slug: "quintal-de-areia", name: "Quintal de Areia", neighborhood: "Moema", city: "São Paulo", description: "A praia cabe no nosso quintal. Beach tennis, gente boa e uma turma que acolhe do primeiro saque ao último ponto.", sports: ["beach-tennis", "volei-praia"], members: 94, image: "/images/urban-court.webp", imagePosition: "85% 50%", amenities: ["Café", "Duchas", "Espaço de convivência"] },
  ],
  posts: [
    { id: "post-marina", authorId: "marina", arenaId: "vila", sportId: "futevolei", content: "Aquele fim de tarde que a gente queria que durasse mais. Quem fecha o próximo jogo com a gente?", photo: "/images/urban-court.webp", createdAt: -18 * minute, likes: 24 },
    { id: "post-bia", authorId: "bia", arenaId: "ipanema", sportId: "beach-tennis", content: "Procurando uma dupla pro beach amanhã, às 19h. Nível intermediário e zero pressão. O importante é jogar!", createdAt: -42 * minute, likes: 12 },
    { id: "post-lucas", authorId: "lucas", arenaId: "alto", sportId: "volei-praia", content: "Hoje teve gente nova na roda e jogo até acenderem as luzes. É por isso que eu volto.", createdAt: -75 * minute, likes: 31 },
  ],
  comments: [
    { id: "comment-1", postId: "post-marina", authorId: "lucas", content: "Pode contar comigo no próximo!", createdAt: -12 * minute },
    { id: "comment-2", postId: "post-bia", authorId: "pedro", content: "Tô dentro! Jogo no Quintal também.", createdAt: -25 * minute },
  ],
  checkins: [
    { id: "check-marina", playerId: "marina", arenaId: "vila", sportId: "futevolei", startedAt: -30 * minute, expiresAt: 90 * minute },
    { id: "check-lucas", playerId: "lucas", arenaId: "vila", sportId: "volei-praia", startedAt: -20 * minute, expiresAt: 100 * minute },
    { id: "check-bia", playerId: "bia", arenaId: "ipanema", sportId: "beach-tennis", startedAt: -15 * minute, expiresAt: 105 * minute },
    { id: "check-julia", playerId: "julia", arenaId: "alto", sportId: "volei-praia", startedAt: -45 * minute, expiresAt: 75 * minute },
  ],
  activities: [
    { id: "activity-1", playerId: "julia", arenaId: "alto", text: "chegou para o vôlei", minutesAgo: 8 },
    { id: "activity-2", playerId: "bia", arenaId: "ipanema", text: "tá procurando uma dupla", minutesAgo: 20 },
    { id: "activity-3", playerId: "marina", arenaId: "vila", text: "compartilhou um fim de tarde", minutesAgo: 35 },
  ],
};
