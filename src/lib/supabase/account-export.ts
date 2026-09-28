import { directMessagesEnabled, productMeasurementEnabled } from '@/lib/features';
import { createAdminClient } from '@/lib/supabase/admin';
import { MutationError, mutationFailure } from '@/lib/supabase/mutations';

const MAX_ACCOUNT_ARCHIVE_BYTES = 8 * 1024 * 1024;
const ACCOUNT_ARCHIVE_TOO_LARGE = 'Seu histórico excede o tamanho do download automático. Solicite uma cópia pelo contato de privacidade.';

type AccountExportUser = {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string | null;
};

function exportFailure(error: { code?: string } | null) {
  if (error?.code === 'P0413') throw new MutationError(413, ACCOUNT_ARCHIVE_TOO_LARGE);
  if (error) mutationFailure(error);
}

export async function buildAccountArchive(user: AccountExportUser) {
  // Privacy exports use only the server-verified subject, including while the
  // social account is suspended. The service credential never reaches clients.
  const admin = createAdminClient();
  const account = await admin.rpc('export_account_data', { p_user: user.id });
  exportFailure(account.error);

  const media = await admin.rpc('export_account_media_extra', { p_user: user.id });
  exportFailure(media.error);

  let messages: Record<string, unknown> = {};
  const messageExport = await admin.rpc('export_account_messages', { p_user: user.id });
  if (messageExport.error?.code === 'P0413') throw new MutationError(413, ACCOUNT_ARCHIVE_TOO_LARGE);
  // A rollback of the UI flag must not silently omit messages already stored.
  // Only an absent additive RPC is tolerated before the feature is activated.
  if (messageExport.error && (directMessagesEnabled() || !['PGRST202', '42883'].includes(messageExport.error.code))) {
    mutationFailure(messageExport.error);
  }
  if (!messageExport.error) messages = messageExport.data as Record<string, unknown>;

  let measurement: Record<string, unknown> = {};
  const measurementExport = await admin.rpc('export_product_measurement', { p_user: user.id });
  if (measurementExport.error?.code === 'P0413') throw new MutationError(413, ACCOUNT_ARCHIVE_TOO_LARGE);
  // Migration-first rollout is additive. Before measurement is activated, an
  // N-1 database may omit this empty section without breaking privacy export.
  if (measurementExport.error && (productMeasurementEnabled() || !['PGRST202', '42883'].includes(measurementExport.error.code))) {
    mutationFailure(measurementExport.error);
  }
  if (!measurementExport.error) measurement = measurementExport.data as Record<string, unknown>;

  const archive = {
    format: 'pico-account-v1',
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      emailConfirmedAt: user.email_confirmed_at,
    },
    data: {
      ...(account.data as Record<string, unknown>),
      ...(media.data as Record<string, unknown>),
      ...messages,
      ...measurement,
    },
    media: 'Referências de fotos e vídeos; este arquivo não contém os bytes dos arquivos.',
  };

  if (Buffer.byteLength(JSON.stringify(archive), 'utf8') > MAX_ACCOUNT_ARCHIVE_BYTES) {
    throw new MutationError(413, ACCOUNT_ARCHIVE_TOO_LARGE);
  }
  return archive;
}
