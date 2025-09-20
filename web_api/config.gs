// --------------------------------------------------
// グローバル定数の定義
const CONF = {
    MAX_RANKING: 50, //ランキングを取得するMAX数
    MAX_REPEAT: 1,//fetchAll()を繰り返すMAX数
    FETCH_MAX: 20,  // fetchAll() で一度にフェッチするページ数
    NOTE_URL: 'https://note.com/[USER_ID]/n/', //記事本文
    API_URL: 'https://note.com/api/v2/creators/[USER_ID]/contents?kind=note&disabled_pinned=true&page=',
    API_CMNT_URL: 'https://note.com/api/v1/note/',
    API_CMNT_URL_V3: 'https://note.com/api/v3/notes/[KEY]/note_comments?per_page=20&order=newest',
  };
