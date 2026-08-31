// クラス表示変換・student_keyの並び替え用ユーティリティ
// 例: import { CLASS_LABELS, CLASS_LIST, parseStudentKey, sortStudentKeys, sortByClassAndNumber } from './classUtils';

// 表示名の変換は必ずここだけで行う（他の場所で "組" を直接書かない）
export const CLASS_LABELS = {
  4: '4組',
  5: '5組',
  6: '6組',
  8: '8組',
};

// ログイン画面などでクラスボタンを並べる順番
export const CLASS_LIST = [4, 5, 6, 8];

// "4-1" -> { classNum: 4, number: 1 }
export function parseStudentKey(key) {
  const [c, n] = key.split('-').map(Number);
  return { classNum: c, number: n };
}

// "4-1" と "4組1番" のような表示用文字列を作る
export function formatStudentLabel(key, initial) {
  const { classNum, number } = parseStudentKey(key);
  const label = CLASS_LABELS[classNum] ?? `${classNum}組`;
  return initial ? `${label} ${number}番 (${initial})` : `${label} ${number}番`;
}

// student_key の配列を「クラス→出席番号」の数値順にソートする
// 文字列のままソートすると "4-10" が "4-9" より前に来てしまうため必須
export function sortStudentKeys(keys) {
  return [...keys].sort((a, b) => {
    const pa = parseStudentKey(a);
    const pb = parseStudentKey(b);
    if (pa.classNum !== pb.classNum) return pa.classNum - pb.classNum;
    return pa.number - pb.number;
  });
}

// { student_key, ... } を含むオブジェクト配列を同様にソートする
// 進捗ボードなど、Supabaseから取得した行データをそのまま並べたい場合はこちら
export function sortByClassAndNumber(items, keyField = 'student_key') {
  return [...items].sort((a, b) => {
    const pa = parseStudentKey(a[keyField]);
    const pb = parseStudentKey(b[keyField]);
    if (pa.classNum !== pb.classNum) return pa.classNum - pb.classNum;
    return pa.number - pb.number;
  });
}
