/**
 * Members at the coach's branch who are assigned to this coach in their profile.
 */

export function memberInCoachBranch(member, coachSession, partnerGyms) {
  const pgId = String(coachSession?.partnerGymId || '').trim();
  const regId = String(coachSession?.registeredGymId || '').trim();
  if (!member || typeof member !== 'object') return false;
  if (pgId && String(member.partnerGymId || '').trim() === pgId) return true;
  if (regId && String(member.registeredGymId || '').trim() === regId) return true;
  const pg = (partnerGyms || []).find((g) => g.id === pgId);
  if (
    pg?.linkedGymId &&
    String(member.registeredGymId || '').trim() === String(pg.linkedGymId).trim()
  ) {
    return true;
  }
  return false;
}

export function isMemberAssignedToCoach(member, coachSession) {
  if (!member || !coachSession) return false;
  const coachIdKey = String(coachSession.coachId || '').trim().toUpperCase();
  const coachNameKey = String(coachSession.coachName || '').trim().toLowerCase();
  const p = member.profile || {};
  const pid = String(p.coachId || '').trim().toUpperCase();
  const pname = String(p.coachName || '').trim().toLowerCase();
  if (coachIdKey && pid && pid === coachIdKey) return true;
  if (coachNameKey && pname && pname === coachNameKey) return true;
  return false;
}

export function coachScopedClients(users, coachSession, partnerGyms) {
  return (users || []).filter(
    (u) =>
      memberInCoachBranch(u, coachSession, partnerGyms) &&
      isMemberAssignedToCoach(u, coachSession)
  );
}
