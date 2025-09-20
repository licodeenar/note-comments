function getNoteList() {
    const resultDispId = 'note_result';
    const api_key = 'AKfycbz7l4CBZlQdTQyruSqr2plL0X3i8ynlBwWwWB1aFFHgEFh2Pcdj4dAUFE0wBLypobgk';
    let req = new XMLHttpRequest();
    let form = document.getElementById('setting');
    let url = 'https://script.google.com/macros/s/' + api_key +
        '/exec?id=' + form.note_id.value +
        '&key=' + form.note_key.value;
    let isJson = form.note_json.checked;

    //テーブルをクリア＆フォームをロック
    document.getElementById(resultDispId).innerHTML = '<img src="img/waiting.gif" width="50" height="50"><br>しばらく時間がかかります。。。<br><br><br>';
    setFormDisabled(true);

    req.open("GET", url, true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            //ロックを解除
            setFormDisabled(false);
            if (req.status == 200) {
                //結果を出力
                drawTable(req.responseText, resultDispId, isJson);
            } else {
                drawTable('', resultDispId, isJson);
            }
        }
    };
    req.send(null);
}

function setFormDisabled(lock) {
    document.getElementById('note_exe').disabled = lock;
    document.getElementById('note_id').disabled = lock;
}

function drawTable(jasons, elementId, isJson) {
    const form = document.getElementById('setting');
    let obj;
    let html = '';

    if (jasons == '"error"' || jasons == '') {
        document.getElementById(elementId).innerHTML = '情報を取得できませんでした。<br><br><br>';
    } else {
        if (isJson) {
            // JSONのまま表示
            document.getElementById(elementId).innerHTML = '<span class="note_data_json">' + jasons + '</span>';
        } else {
            obj = JSON.parse(jasons);
            html = '<table class="note_list"><tr><!-- th>#</th --><th>なまえ / ID</th><th><img class="like_icon" src="img/comment.svg"></th></tr>'
            for (let i = 0; i < obj.length; i++) {
                html += '<tr>' +
                    //'<td class="note_data_id">' + (i + 1) + '</td>' + 
                    '<td>' +
                    '<div class="note_data_container">' +
                    '<div class="note_icon"><a href="' + obj[i].url + '" target="_blank">' + 
                    '<img class="note_icon_img" src="' + obj[i].userProfileImagePath + '"></a></div>' + 
                    '<div class="note_username">' + 
                    '<div class="note_username_nickname"><a href="' + obj[i].url + '" target="_blank">' + obj[i].nickname + '</a></div>' + 
                    '<div class="note_data_name">' + obj[i].urlname + '</div>' +
                    '</div></div>' + 
                    '<div class="detail"><div style="display:flex;justify-content:space-between;">' + 
                    '<a href="?id=' + obj[i].urlname + '&key=' + form.note_key.value + '">[このユーザで集計]</a> ' + 
                    '<a href="javascript:setDisplay(\'articles_' + i + '\');">▽詳しくみる</a>' + 
                    '</div></div>' +
                    '<div class="article_list" id="articles_' + i + '">' +
                    getArticles(obj[i].articles) +
                    '</div></td>' + 
                    '<td class="note_data_count">' + obj[i].count + '</td></tr>';
            }
            html += '</table>';

            document.getElementById(elementId).innerHTML = html;
        }
    }
}

function getArticles(articles) {
    let html = '';
    for (let i = 0; i < articles.length; i++) {
        let title = articles[i].article_name;
        if (title == null || title == '') {
            title = '[タイトルなし]';
        }
        html += i + 1 + '. ' + '<a href="' +
            articles[i].article_url + '" target="_blank">' +
            title + '</a><br>';
    }
    return html;
}

function setDisplay(idName) {
    const doc = document.getElementById(idName);

    if (doc.style.display === 'block') {
        // noneで非表示
        doc.style.display = 'none';
    } else {
        // blockで表示
        doc.style.display = 'block';
    }
}
