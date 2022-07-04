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
    document.getElementById(resultDispId).innerHTML = 'しばらく時間がかかります。。。';
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
    let obj;
    let html = '';

    if (jasons == '"error"' || jasons == '') {
        document.getElementById(elementId).innerHTML = '情報を取得できませんでした。';
    } else {
        if (isJson) {
            // JSONのまま表示
            document.getElementById(elementId).innerHTML = '<span class="note_data_json">' + jasons + '</span>';
        } else {
            obj = JSON.parse(jasons);
            html = '<table class="note_list"><tr><th>#</th><th>ID / なまえ</th><th><img class="like_icon" src="img/like.svg"></th></tr>'
            for (let i = 0; i < obj.length; i++) {
                html += '<tr><td class="note_data_id">' +
                    (i + 1) + '位</td><td>' +
                    '<a href="' + obj[i].url + '" target="_blank">' +
                    obj[i].urlname + '</a><br><div class="note_data_name">' +
                    obj[i].nickname + '</div></td><td class="note_data_count">' +
                    obj[i].count + '</td></tr>';
            }
            html += '</table>';

            document.getElementById(elementId).innerHTML = html;
        }
    }
}