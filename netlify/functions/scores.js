exports.handler = async function(event, context) {
  const TOURNAMENT_ID = '401811941';
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?season=2026&event=${TOURNAMENT_ID}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Extract just what we need: player name -> score to par
    const scores = {};

    const competitors = data?.events?.[0]?.competitions?.[0]?.competitors || [];
    for (const player of competitors) {
      const name = player?.athlete?.displayName;
      const scoreToPar = player?.score?.value ?? player?.linescores?.reduce((sum, r) => sum + (r?.value || 0), 0);
      const toParDisplay = player?.statistics?.find(s => s.name === 'scoreToPar')?.displayValue
        || player?.score?.displayValue;

      if (name) {
        // Convert display like "-5" or "+3" or "E" to number
        let numericScore = 0;
        if (toParDisplay === 'E' || toParDisplay === 'Even') {
          numericScore = 0;
        } else if (toParDisplay) {
          numericScore = parseInt(toParDisplay.replace('+', ''), 10) || 0;
        }
        scores[name] = numericScore;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ scores, updated: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
