import type { ReadProfile } from '../types/read';

export function profileSetupComplete(profile: ReadProfile) {
  return profile.onboardingCompleted && Boolean(profile.avatarPath)
    && profile.name.trim().length >= 2 && /^[a-z0-9_]{3,40}$/.test(profile.username)
    && profile.sports.some(item => item.isPrimary);
}
