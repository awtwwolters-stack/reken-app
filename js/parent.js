// Debug/parent view - shows what the adaptive system knows and why, per skill.
// Deliberately unstyled/functional rather than polished.

function formatDate(timestamp) {
  if (!timestamp) return 'nooit';
  const d = new Date(timestamp);
  return d.toLocaleDateString('nl-NL') + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function renderParentView() {
  const state = loadState();
  const profileSkills = (state.profiles[DEFAULT_PROFILE_ID] && state.profiles[DEFAULT_PROFILE_ID].skills) || {};
  const skillsById = Object.fromEntries(CURRICULUM.skills.map((s) => [s.id, s]));
  const tbody = document.getElementById('parent-table-body');
  tbody.innerHTML = '';

  CURRICULUM.skills.forEach((skill) => {
    const row = document.createElement('tr');

    if (!skill.implemented) {
      row.innerHTML = `
        <td>${skill.name}</td>
        <td>${skill.domain}</td>
        <td colspan="7" class="not-implemented">nog niet gebouwd (staat in de data, wachtend op implementatie)</td>
      `;
      tbody.appendChild(row);
      return;
    }

    const skillState = stateOrNew(skill, profileSkills, skillsById);
    const rate = successRate(skillState);
    const { bucket, reason } = classifySkill(skill, skillState, profileSkills);
    const change = skillState.lastTierChange;

    row.innerHTML = `
      <td>${skill.name}</td>
      <td>${skill.domain}</td>
      <td>${skillState.tier} / ${maxTier(skill)}</td>
      <td>${rate === null ? '-' : Math.round(rate * 100) + '%'}</td>
      <td>${skillState.totalAttempts}</td>
      <td>${formatDate(skillState.lastPracticed)}</td>
      <td><strong>${bucket}</strong></td>
      <td>${reason}</td>
      <td>${change ? `${formatDate(change.at)}: ${change.reason}` : '-'}</td>
    `;
    tbody.appendChild(row);
  });

  const sessions = state.sessions || [];
  const sessionsList = document.getElementById('parent-sessions');
  sessionsList.innerHTML = '';
  sessions.slice(-10).reverse().forEach((s) => {
    const li = document.createElement('li');
    const d = new Date(s.date);
    const minutes = s.activeMinutes !== undefined ? `, ${s.activeMinutes} min` : '';
    li.textContent = `${d.toLocaleDateString('nl-NL')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} — ${s.totalCorrect} / ${s.totalAttempts} goed${minutes}`;
    sessionsList.appendChild(li);
  });
  if (sessions.length === 0) {
    sessionsList.innerHTML = '<li>Nog geen sessies gedaan.</li>';
  }
}

window.addEventListener('DOMContentLoaded', renderParentView);
