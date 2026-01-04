// Noms de rangs drôles et amusants
export function getRankFromMMR(mmr) {
  if (mmr >= 2800) return { tier: 'Keyboard Destroyer', rank: '', mmr, color: '#FFD700' };
  if (mmr >= 2600) return { tier: 'Speed Demon', rank: '', mmr, color: '#FF1493' };
  if (mmr >= 2400) return { tier: 'Type Master', rank: '', mmr, color: '#9370DB' };
  if (mmr >= 2200) return { tier: 'Lightning Fingers', rank: 'I', mmr, color: '#00BFFF' };
  if (mmr >= 2000) return { tier: 'Lightning Fingers', rank: 'II', mmr, color: '#00BFFF' };
  if (mmr >= 1800) return { tier: 'Lightning Fingers', rank: 'III', mmr, color: '#00BFFF' };
  if (mmr >= 1700) return { tier: 'Lightning Fingers', rank: 'IV', mmr, color: '#00BFFF' };
  if (mmr >= 1600) return { tier: 'Word Wizard', rank: 'I', mmr, color: '#00CED1' };
  if (mmr >= 1500) return { tier: 'Word Wizard', rank: 'II', mmr, color: '#00CED1' };
  if (mmr >= 1400) return { tier: 'Word Wizard', rank: 'III', mmr, color: '#00CED1' };
  if (mmr >= 1300) return { tier: 'Word Wizard', rank: 'IV', mmr, color: '#00CED1' };
  if (mmr >= 1200) return { tier: 'Key Crusher', rank: 'I', mmr, color: '#FFD700' };
  if (mmr >= 1100) return { tier: 'Key Crusher', rank: 'II', mmr, color: '#FFD700' };
  if (mmr >= 1000) return { tier: 'Key Crusher', rank: 'III', mmr, color: '#FFD700' };
  if (mmr >= 900) return { tier: 'Key Crusher', rank: 'IV', mmr, color: '#FFD700' };
  if (mmr >= 800) return { tier: 'Fast Typer', rank: 'I', mmr, color: '#C0C0C0' };
  if (mmr >= 700) return { tier: 'Fast Typer', rank: 'II', mmr, color: '#C0C0C0' };
  if (mmr >= 600) return { tier: 'Fast Typer', rank: 'III', mmr, color: '#C0C0C0' };
  if (mmr >= 500) return { tier: 'Fast Typer', rank: 'IV', mmr, color: '#C0C0C0' };
  if (mmr >= 400) return { tier: 'Novice', rank: 'I', mmr, color: '#CD7F32' };
  if (mmr >= 300) return { tier: 'Novice', rank: 'II', mmr, color: '#CD7F32' };
  if (mmr >= 200) return { tier: 'Novice', rank: 'III', mmr, color: '#CD7F32' };
  return { tier: 'Novice', rank: 'IV', mmr, color: '#CD7F32' };
}

