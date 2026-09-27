import { parseGameShare } from '../supabase/game-sharing.ts';
import { parseGameMutation } from '../supabase/games.ts';
import { mediaPath } from '../supabase/media.ts';
import { postVideoPath } from '../supabase/post-video.ts';
import { MutationError } from '../supabase/mutations.ts';
import { MOBILE_VIDEO_PUBLISHING_ENABLED } from './features.ts';

export function parseMobileGameMutation(body: Record<string, unknown>) {
  if (body.action !== 'share') return parseGameMutation(body);

  const shareBody = { ...body };
  delete shareBody.action;
  const share = parseGameShare(shareBody);
  if (share.videoPath && !MOBILE_VIDEO_PUBLISHING_ENABLED) {
    throw new MutationError(409, 'O envio de vídeo ainda não está disponível nesta versão do iPhone.');
  }

  return {
    ...share,
    action: 'share' as const,
    imagePath: share.imagePath ? mediaPath(share.imagePath) : undefined,
    videoPath: share.videoPath ? postVideoPath(share.videoPath) : undefined,
  };
}
