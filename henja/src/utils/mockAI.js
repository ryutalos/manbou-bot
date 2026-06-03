const SAMPLE_LABELS = [
  '自分だけ続いている',
  '誰も気づいていない',
  '置き場所がない',
  'いつの間にか変わっていた',
  '名前がつく前の感じ',
  '繰り返すのに理由がわからない',
  'ちょうどいい言葉がない',
  '見ていないときに動いている気がする',
  '昨日まではそうじゃなかった',
  '他の人も感じているかもしれない',
  '説明するとなぜかおかしくなる',
  '気にしないようにするほど気になる',
];

const SAMPLE_NAMES = [
  '恥ずかしさはどこにいくの',
  '昨日の自分からの置き配',
  '誰も頼んでいないのに始まる',
  '見ていないときだけ正常に動く',
  '気づいたら習慣になっていた件',
  '返事をしたかどうかわからない問題',
];

export function generateLabels(text) {
  // shuffle and pick 5-6
  const shuffled = [...SAMPLE_LABELS].sort(() => Math.random() - 0.5);
  const count = Math.random() > 0.5 ? 6 : 5;
  return shuffled.slice(0, count);
}

export function generateSpecimenName(text, labels) {
  return SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
}
