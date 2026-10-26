// Health recovery timeline after the last cigarette.
// Times are approximate and come from population studies of cigarette smokers.
const MIN = 60000, HOUR = 3600000, DAY = 86400000;

export const HEALTH_MILESTONES = [
  { afterMs: 20 * MIN, title: '20 minutes', body: 'Heart rate and blood pressure start dropping back toward normal.' },
  { afterMs: 12 * HOUR, title: '12 hours', body: 'Carbon monoxide in your blood falls to a normal level, so your blood carries more oxygen.' },
  { afterMs: 24 * HOUR, title: '1 day', body: 'Nicotine is almost gone from your bloodstream. Cravings and irritability are near their peak. They will ease.' },
  { afterMs: 48 * HOUR, title: '2 days', body: 'Damaged nerve endings begin to recover. Taste and smell start to sharpen.' },
  { afterMs: 72 * HOUR, title: '3 days', body: 'Nicotine has cleared your body. Bronchial tubes relax and breathing feels easier. The worst of withdrawal is behind you.' },
  { afterMs: 14 * DAY, title: '2 weeks', body: 'Circulation is improving. Walking and climbing stairs feel easier.' },
  { afterMs: 28 * DAY, title: '28 days', body: 'Lung function is improving and coughing is less. People who reach 28 days are about five times more likely to stay quit.' },
  { afterMs: 90 * DAY, title: '3 months', body: 'Circulation and lung function have improved markedly. The tiny hairs that clean your lungs are working again.' },
  { afterMs: 270 * DAY, title: '9 months', body: 'Coughing and shortness of breath have decreased. Fewer colds and chest infections.' },
  { afterMs: 365 * DAY, title: '1 year', body: 'Your added risk of coronary heart disease is about half that of someone still smoking.' },
  { afterMs: 5 * 365 * DAY, title: '5 years', body: 'Stroke risk can fall to that of a non-smoker. Risk of mouth, throat and bladder cancers is halved.' },
  { afterMs: 10 * 365 * DAY, title: '10 years', body: 'Risk of dying from lung cancer is about half that of a continuing smoker.' },
  { afterMs: 15 * 365 * DAY, title: '15 years', body: 'Risk of coronary heart disease is close to that of someone who never smoked.' },
];

export const BADGES = [
  { afterMs: 24 * HOUR, label: '24 hours', emoji: '🌅' },
  { afterMs: 72 * HOUR, label: '72 hours, nicotine free', emoji: '🧪' },
  { afterMs: 7 * DAY, label: '1 week', emoji: '🗓️' },
  { afterMs: 14 * DAY, label: '2 weeks', emoji: '💪' },
  { afterMs: 28 * DAY, label: '28 days', emoji: '🏅' },
  { afterMs: 100 * DAY, label: '100 days', emoji: '💯' },
  { afterMs: 365 * DAY, label: '1 year', emoji: '🎉' },
];

export const HEALTH_SOURCES = [
  { label: 'American Cancer Society: Health benefits of quitting smoking over time', url: 'https://www.cancer.org/cancer/risk-prevention/tobacco/benefits-of-quitting-smoking-over-time.html' },
  { label: 'CDC: Benefits of quitting smoking', url: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html' },
  { label: 'NHS Better Health: Quit smoking', url: 'https://www.nhs.uk/better-health/quit-smoking/' },
];

export const HEALTH_NOTE = 'These milestones come from studies of cigarette smokers. Research on recovery after quitting vaping is newer and thinner, but heart rate, blood pressure and nicotine clearance follow the same pattern.';
