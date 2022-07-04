//HTTP GETをハンドリングする
function doGet(e){

  //リクエストパラメータ名"id"の値を取得する
  let paramID = e.parameter.id;
  let paramKey = e.parameter.key;
  let result;
  let out;

  try{
    if(paramID !== '' &&
     (paramKey === 'article60' || 
      paramKey === 'article120' || 
      paramKey === 'article240')){
      
      // ランキングを取得
      result = main(paramID, paramKey);

    } else {
      throw new Error('パラメータが正しく指定されていません。');
    }
  }catch(e){
    console.log(e);
    result = 'error';
  }

  //Mime TypeをJSONに設定
  out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  out.setContent(JSON.stringify(result));

  return out;
}