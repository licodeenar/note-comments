//HTTP GETをハンドリングする
function doGet(e){

  //リクエストパラメータ名"id"の値を取得する
  let paramID = getNoteUserID(e.parameter.id);
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

//入力値がIDがURLかでIDを抜き出す
function getNoteUserID(inputString) {
  // URLだった場合
  if (inputString.includes("note.com/")) {
    const parts = inputString.split('/');    
    return parts[3];
  }
  
  // IDだった場合
  return inputString;
}
