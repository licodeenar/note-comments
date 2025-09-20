'use strict';
function debug(){
  let json = main('licodeenar', 'article60');

  console.log(json);
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
    for(let i = start; i < end; i++){
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

  for(let repeat = 0; repeat * CONF.FETCH_MAX < articles.length; repeat++){
    let requests = [];
    let articleURLs = [];
    let requests_v3 = [];
    let articleURLs_v3 = [];
  
    // リクエストを生成
    const start = repeat * CONF.FETCH_MAX;
    let end = start + CONF.FETCH_MAX;
    if(end > articles.length){
      end = articles.length;
    }
    for(let i = start; i < end; i++){
      //新しいコメントタイプかチェック
      const isNoteComment = articles[i].capabilities.noteComment;

      if(isNoteComment){
        //新しいコメントタイプ v3
        let commentUrl = CONF.API_CMNT_URL_V3.replace('[KEY]', articles[i].key);
        requests_v3.push(commentUrl);
        articleURLs_v3.push([
          noteURL + articles[i].key, 
          commentUrl,
          articles[i].name,
          articles[i].key
        ]);
      }else{
        //古いコメントタイプ
        requests.push(CONF.API_CMNT_URL + articles[i].id + '/comments');
        articleURLs.push([
          noteURL + articles[i].key, 
          CONF.API_CMNT_URL + articles[i].id + '/comments',
          articles[i].name
        ]);
      }
    }

    //新API
    let fetch = [];
    fetch = getCommentsFromNewApi(requests_v3, articleURLs_v3);
    pages = pages.concat(fetch);

    let params = getRequestChild(fetch, noteURL);
    if(params.count > 0){
      fetch = getCommentsFromNewApi(params.requests_v3, params.articleURLs_v3);
      pages = pages.concat(fetch);
    }

    //旧API
    fetch = getCommentsFromOldApi(requests, articleURLs);
    pages = pages.concat(fetch);
  
  }

  // LISTをJSON PAGESから作成する（ソートするため配列に変換）
  let commentList = [];
  //commentList = convertUserList(pages); //コメント単位で集計
  commentList = convertUserList(removeDuplicateArticles(pages)); //コメントを記事単位でDISTINCT
  

  //配列をカウント数で並び替えソート
  commentList.sort( (a, b) => {
    return b[b.length - 3] - a[a.length - 3];
  });

  //ランキングJSONを返す
  return commentListJSON(commentList);
}

// 親コメントを取得した後に、
// 子コメントのリクエストをまとめて生成する
function getRequestChild(parents, noteURL) {
  let requests_v3 = [];
  let articleURLs_v3 = [];

  for (let i = 0; i < parents.length; i++) {
    //子コメントがあるかチェック
    let replay_count = parents[i].reply_count;

    if(replay_count && replay_count > 0){
      //新しいコメントタイプ v3
      let commentUrl = CONF.API_CMNT_URL_V3.replace('[KEY]', parents[i].article_key) + 
                      '&parent_key=' + parents[i].key;
      requests_v3.push(commentUrl);
      articleURLs_v3.push([
        noteURL + parents[i].article_key, 
        commentUrl,
        parents[i].article_name
      ]);
    }
  } 

  const result = {
    requests_v3: requests_v3,
    articleURLs_v3: articleURLs_v3,
    count: requests_v3.length
  }

  return result;
}

// 新しいAPIでコメントページを取得する
function getCommentsFromNewApi(requests, articleURLs) {
  let pages = [];
  let remainingRequests = [];

  // 非同期で複数の記事のコメントをまとめて取得
  const responses = UrlFetchApp.fetchAll(requests);

  for (let i = 0; i < responses.length; i++) {
    const json_data = JSON.parse(responses[i].getContentText('UTF-8'));
    const comments = json_data.data;

    // 現在のページのコメントを処理
    for (const comment of comments) {
      const commentText = comment.comment.children[0].children[0].value;
      pages.push({
        user_urlname: comment.user.urlname,
        user_nickname: comment.user.nickname,
        user_profile_image_path: comment.user.profile_image_url,
        comment: commentText,
        created_at: comment.created_at,
        article_url: articleURLs[i][0],
        article_name: articleURLs[i][2],
        article_key: articleURLs[i][3],
        key: comment.key,
        reply_count: comment.reply_count
      });
    }

    // 次のページがある場合は、後でまとめて取得するために情報を記録
    if (json_data.next_page !== null) {
      remainingRequests.push({
        articleURL: articleURLs[i][0],
        articleName: articleURLs[i][2],
        url: requests[i],
        next_page: json_data.next_page,
        article_key: articleURLs[i][3]
      });
    }
  }

  // ページが分かれる記事のコメントをまとめて取得
  for (const req of remainingRequests) {
    pages = pages.concat(getRestCommentsNewApi
      (req.articleURL, req.articleName, req.url, req.article_key, req.next_page));
  }

  return pages;
}

// --------------------------------------------------
//再帰的に残コメントを取得する
function getRestCommentsNewApi(articleURL, articleName, url, articleKey, next_page) {
  let allComments = [];
  
  try {
    const response = UrlFetchApp.fetch(`${url}&page=${next_page}`);
    const json_data = JSON.parse(response.getContentText('UTF-8'));
    const comments = json_data.data;

    // 現在のページのコメントを処理
    for (const comment of comments) {
      const commentText = comment.comment.children[0].children[0].value;
      allComments.push({
        user_urlname: comment.user.urlname,
        user_nickname: comment.user.nickname,
        user_profile_image_path: comment.user.profile_image_url,
        comment: commentText,
        created_at: comment.created_at,
        article_url: articleURL,
        article_name: articleName,
        article_key: articleKey,
        key: comment.key,
        reply_count: comment.reply_count
      });
    }

    // 次のページがあるかチェック
    if (json_data.next_page !== null) {
      // 再帰的に次のページを取得
      return allComments.concat(
        getRestCommentsNewApi(articleURL, articleName, url, articleKey, json_data.next_page)
      );
    }

    return allComments;

  } catch (e) {
    console.error(`Error fetching additional comments for ${articleURL}: ${e}`);
    return allComments;
  }
}

// --------------------------------------------------
//旧APIでコメントページを取得する
function getCommentsFromOldApi(requests, articleURLs) {
    let pages = [];
    // 非同期でまとめて取得
    const responses = UrlFetchApp.fetchAll(requests);
    for (let i = 0; i < responses.length; i++) {
        const json_data = JSON.parse(responses[i].getContentText('UTF-8'))['data'];
        //コメント情報を取得（50件MAX）
        for (let j = 0; j < json_data['comments'].length; j++) {
            pages.push({
                user_urlname: json_data['comments'][j].user.urlname,
                user_nickname: json_data['comments'][j].user.nickname,
                user_profile_image_path: json_data['comments'][j].user.user_profile_image_path,
                comment: json_data['comments'][j].comment,
                created_at: json_data['comments'][j].created_at,
                article_url: articleURLs[i][0],
                article_name: articleURLs[i][2]
            });
        }
        //残コメントがある（50件以上コメントが続いている場合
        if (json_data.rest_comment_count > 0) {
            pages = pages.concat(
                getRestComment(articleURLs[i][0],
                    articleURLs[i][2],
                    articleURLs[i][1] + '?max_id=',
                    json_data['comments'][json_data['comments'].length - 1].id));
        }
    }
    return pages;
}

// --------------------------------------------------
//再帰的に残コメントを取得する
function getRestComment(articleURL, articleName, url, maxID) {
    const response = UrlFetchApp.fetch(url + maxID);
    const json_data = JSON.parse(response.getContentText('UTF-8'))['data'];
    let result = [];
    //console.log('残コメント：' + json_data.rest_comment_count);
    //console.log('記事URL：' + articleURL + ';');
    // JSONデータを生成する
    for (let i = 0; i < json_data['comments'].length; i++) {
        result.push({
            user_urlname: json_data['comments'][i].user.urlname,
            user_nickname: json_data['comments'][i].user.nickname,
            comment: json_data['comments'][i].comment,
            created_at: json_data['comments'][i].created_at,
            article_url: articleURL,
            article_name: articleName
        });
    }
    if (json_data.rest_comment_count > 0) {
        // 残コメントがある場合は、再帰呼び出し
        const newMaxID = json_data['comments'][json_data['comments'].length - 1].id;
        //console.log(newMaxID);
        return result.concat(getRestComment(articleURL, url, newMaxID));
    } else {
        // 残コメントがなければ終了
        return result;
    }
}

//JSONを配列[urlname, nickname, cnt, articles]に変換
function convertUserList(users){
  let result = [];
  let isExist;

  //ユーザID毎にリスト化する
  for(let i = 0; i < users.length; i++){
    isExist = false;
    for(let j = 0; j < result.length; j++){
      //既に同IDがリストにある場合はカウントアップ + コメント情報追加
      if(result[j][0] === users[i].user_urlname){
        result[j][2] += 1;
        result[j][3].push([users[i].article_url, users[i].article_name]);
        isExist = true;
        break;
      }
    }
    //IDがまだリストに存在しない場合（初回）
    if(!isExist){
      let articles = [];
      articles.push([users[i].article_url, users[i].article_name]);
      result.push([users[i].user_urlname, users[i].user_nickname, 1, articles, users[i].user_profile_image_path]);
    }
  }

  return result;
}

// 重複する「ユーザーIDと記事URL」を削除する関数
function removeDuplicateArticles(users) {
  const uniqueUsersMap = new Map();

  for (const user of users) {
    const key = `${user.user_urlname}-${user.article_url}`;
    
    // keyがまだMapに存在しない場合のみ、そのコメントをMapに追加
    if (!uniqueUsersMap.has(key)) {
      uniqueUsersMap.set(key, user);
    }
  }

  // Mapの値を配列に変換して返す
  return Array.from(uniqueUsersMap.values());
}

// --------------------------------------------------
// 配列をJSONに変換
function commentListJSON(list){
  let json = [];

  // 返すランキングの上限をセット
  let max = CONF.MAX_RANKING;
  if(max > list.length){
    max = list.length;
  }

  for(let i = 0; i < max; i++){
    json.push({
      urlname: list[i][0],
      nickname: list[i][1],
      url: 'https://note.com/' + list[i][0],
      userProfileImagePath: list[i][4],
      count:  list[i][2],
      articles: articleListJSON(list[i][3])
    });
  }
  return json;
}

//記事リスト部分をJSON化して返す
function articleListJSON(list){
  let json = [];

  for(let i = 0; i < list.length; i++){
    json.push({
      article_url: list[i][0],
      article_name: list[i][1]
    });
  }
  return json;
}

