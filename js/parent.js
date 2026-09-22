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
  const tbody = document.getElementById('parent-table-body');
  tbody.innerHTML = '';

  CURRICULUM.skills.forEach((skill) => {
    const row = document.createElement('tr');

    if (!skill.implemented) {
      row.innerHTML = `
        <td>${skill.name}</td>
        <td>${skill.domain}</td>
        <td colspan="6" class="not-implemented">nog niet gebouwd (staat in de data, wachtend op implementatie)</td>
      `;
      tbody.appendChild(row);
      return;
    }

    const skillState = profileSkills[skill.id] || { tier: 1, recentResults: [], totalAttempts: 0, lastPracticed: null };
    const rate = successRate(skillState);
    const { bucket, reason } = classifySkill(skill, skillState, profileSkills);

    row.innerHTML = `
      <td>${skill.name}</td>
      <td>${skill.domain}</td>
      <td>${skillState.tier} / 5</td>
      <td>${rate === null ? '-' : Math.round(rate * 100) + '%'}</td>
      <td>${skillState.totalAttempts}</td>
      <td>${formatDate(skillState.lastPracticed)}</td>
      <td><strong>${bucket}</strong></td>
      <td>${reason}</td>
    `;
    tbody.appendChild(row);
  });

  const sessions = state.sessions || [];
  const sessionsList = document.getElementById('parent-sessions');
  sessionsList.innerHTML = '';
  sessions.slice(-10).reverse().forEach((s) => {
    const li = document.createElement('li');
    const d = new Date(s.date);
    li.textContent = `${d.toLocaleDateString('nl-NL')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} — ${s.totalCorrect} / ${s.totalAttempts} goed`;
    sessionsList.appendChild(li);
  });
  if (sessions.length === 0) {
    sessionsList.innerHTML = '<li>Nog geen sessies gedaan.</li>';
  }
}

window.addEventListener('DOMContentLoaded', renderParentView);
