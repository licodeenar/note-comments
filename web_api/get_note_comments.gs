'use strict';
function debug(){
  console.log(main('licodeenar', 'article240'));
}

function main(paramID, paramKey){
  //パラメーターをセット
  let maxRepeat = CONF.MAX_REPEAT;
  let maxFetch = CONF.FETCH_MAX;
  let apiURL = CONF.API_URL;
  let noteURL = CONF.NOTE_URL;
  if(paramKey === 'article240'){
    maxRepeat = 2;
    maxFetch = 20;
  }else if(paramKey === 'article120'){
    maxRepeat = 1;
    maxFetch = 20;
  }else{
    maxRepeat = 1;
    maxFetch = 10;
  }
  apiURL = apiURL.replace('[USER_ID]', paramID);
  noteURL = noteURL.replace('[USER_ID]', paramID);

  // 記事の一覧を取得
  const articles = getArticles(apiURL, maxRepeat, maxFetch);

  //COMMENTを取得
  return totalCommentUser(noteURL, articles);
}

// --------------------------------------------------
// fetchALLで非同期で処理を行う。記事を取得
function getArticles(apiURL, maxRepeat, maxFetch) {
  let pages = [];


  fetch_repeat:
  for(let repeat = 0; repeat < maxRepeat; repeat++){
    let requests = [];

    // リクエストを生成
    const start = repeat * maxFetch + 1;
    const end = start + maxFetch;
    for(let i = start; i <= end; i++){
      requests.push(apiURL + i);
    }

    // 非同期でまとめて取得
    const responses = UrlFetchApp.fetchAll(requests);

    for(let i = 0; i < maxFetch; i++){
      const json_data = JSON.parse(responses[i].getContentText('UTF-8'))['data'];

      // ユーザ情報を抽出
      pages = pages.concat(json_data['contents']);
      
      // 最後のページだったら終了
      if(json_data.isLastPage === true){
        break fetch_repeat;
      }
    }
  }

  //JSONで結果を返す
  return pages;
}

//コメントを取得する
function totalCommentUser(noteURL, articles){
  let pages = [];

  for(let repeat = 0; repeat < articles.length; repeat++){
    let requests = [];
    let articleURLs = [];

    // リクエストを生成
    const start = repeat * CONF.FETCH_MAX;
    let end = start + CONF.FETCH_MAX;
    if(end > articles.length){
      end = articles.length;
    }

    for(let i = start; i < end; i++){
      requests.push(CONF.API_CMNT_URL + articles[i].id + '/comments');
      articleURLs.push([
        noteURL + articles[i].key, 
        CONF.API_CMNT_URL + articles[i].id + '/comments']);
    }

    // 非同期でまとめて取得
    const responses = UrlFetchApp.fetchAll(requests);

    for(let i = 0; i < responses.length; i++){
      const json_data = JSON.parse(responses[i].getContentText('UTF-8'))['data'];

      for(let j = 0; j < json_data['comments'].length; j++){
        pages.push({
          user_urlname: json_data['comments'][j].user.urlname,
          user_nickname: json_data['comments'][j].user.nickname,
          comment:json_data['comments'][j].comment,
          created_at:json_data['comments'][j].created_at,
          article_url: articleURLs[i]
        });
      }

      //残コメントがある（50ページ以上コメントが続いている場合
      if(json_data.rest_comment_count > 0){  
        pages = pages.concat(
          getRestComment(articleURLs[i][0], 
          articleURLs[i][1] + '?max_id=', 
          json_data['comments'][json_data['comments'].length -1].id));
      }
    }
  }

  // LISTをJSON PAGESから作成する
  let commentList = [];
  commentList = convertUserList(pages);

  //配列をカウント数で並び替えソート
  commentList.sort( (a, b) => {
    return b[b.length -1] - a[a.length - 1];
  });

  //ランキングJSONを返す
  return commentListJSON(commentList);
}

//JSONを配列[urlname, nickname, cnt]に変換
function convertUserList(users){
  let result = [];
  let isExist;
  for(let i = 0; i < users.length; i++){
    isExist = false;
    for(let j = 0; j < result.length; j++){
      if(result[j][0] === users[i].user_urlname){
        result[j][2] += 1;
        isExist = true;
        break;
      }
    }
    if(!isExist){
      result.push([users[i].user_urlname, users[i].user_nickname, 1]);
    }
  }
  return result;
}

// --------------------------------------------------
//再帰的に残コメントを取得する
function getRestComment(articleURL, url, maxID){
  const response = UrlFetchApp.fetch(url + maxID);
  const json_data = JSON.parse(response.getContentText('UTF-8'))['data'];
  let result = [];

  console.log('残コメント：' + json_data.rest_comment_count);
  console.log('記事URL：' + articleURL + ';');

  // JSONデータを生成する
  for(let i = 0; i < json_data['comments'].length; i++){
      result.push({
          user_urlname: json_data['comments'][i].user.urlname,
          user_nickname: json_data['comments'][i].user.nickname,
          comment:json_data['comments'][i].comment,
          created_at:json_data['comments'][i].created_at,
          article_url: articleURL
      });
  }
  
  if(json_data.rest_comment_count > 0){
    // 残コメントがある場合は、再帰呼び出し
    const newMaxID = json_data['comments'][json_data['comments'].length -1].id;
    console.log(newMaxID);
    return result.concat(getRestComment(articleURL, url, newMaxID));
  }else{
    // 残コメントがなければ終了
    return result;
  }
}

// --------------------------------------------------
// 配列をJSONに変換
function commentListJSON(list){
  let json = [];
  let max = CONF.MAX_RANKING;
  if(max > list.length){
    max = list.length;
  }

  for(let i = 0; i < max; i++){
    json.push({
      urlname: list[i][0],
      nickname: list[i][1],
      url: 'https://note.com/' + list[i][0],
      count:  list[i][2]
    });
  }
  return json;
}
