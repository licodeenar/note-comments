function getNoteList() {
    const resultDispId = 'note_result';
    const api_key = 'AKfycbz7l4CBZlQdTQyruSqr2plL0X3i8ynlBwWwWB1aFFHgEFh2Pcdj4dAUFE0wBLypobgk';
    let req = new XMLHttpRequest();
    let form = document.getElementById('setting');
    let noteId = form.note_id.value.trim();
    let isJson = form.note_json.checked;

    // 未入力なら実行しない
    if (noteId === '') {
        document.getElementById(resultDispId).innerHTML = '<div class="note_status">noteのIDを入力してください。</div>';
        return;
    }

    let url = 'https://script.google.com/macros/s/' + api_key +
        '/exec?id=' + encodeURIComponent(noteId) +
        '&key=' + encodeURIComponent(form.note_key.value);

    //テーブルをクリア＆フォームをロック
    document.getElementById(resultDispId).innerHTML = '<div class="note_status note_loading">しばらく時間がかかります。。。</div>';
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

// HTMLに埋め込む値をエスケープ（XSS対策）
function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function drawTable(jasons, elementId, isJson) {
    const form = document.getElementById('setting');
    let obj;
    let html = '';

    if (jasons == '"error"' || jasons == '') {
        document.getElementById(elementId).innerHTML = '<div class="note_status">情報を取得できませんでした。</div>';
        return;
    }

    if (isJson) {
        // JSONのまま表示
        document.getElementById(elementId).innerHTML = '<span class="note_data_json">' + escapeHtml(jasons) + '</span>';
        return;
    }

    try {
        obj = JSON.parse(jasons);
    } catch (e) {
        document.getElementById(elementId).innerHTML = '<div class="note_status">情報を取得できませんでした。</div>';
        return;
    }

    html = '<div class="note_count">' + obj.length + '人</div><ul class="note_list">';
    for (let i = 0; i < obj.length; i++) {
        let aggregateUrl = '?id=' + encodeURIComponent(obj[i].urlname) +
            '&key=' + encodeURIComponent(form.note_key.value);
        html += '<li class="note_item">' +
            '<div class="note_row">' +
            '<a class="note_user" href="' + escapeHtml(obj[i].url) + '" target="_blank" rel="noopener">' +
            '<img class="note_avatar" src="' + escapeHtml(obj[i].userProfileImagePath) + '" alt="">' +
            '<span class="note_body">' +
            '<span class="note_data_name">' + escapeHtml(obj[i].nickname) + '</span>' +
            '<span class="note_data_id">@' + escapeHtml(obj[i].urlname) + '</span>' +
            '</span>' +
            '</a>' +
            '<span class="note_comment_count"><img src="img/comment.svg" alt="コメント数">' + escapeHtml(obj[i].count) + '</span>' +
            '</div>' +
            '<div class="detail">' +
            '<a href="' + escapeHtml(aggregateUrl) + '">[このユーザで集計]</a>' +
            '<a href="javascript:setDisplay(\'articles_' + i + '\');">▽詳しくみる</a>' +
            '</div>' +
            '<div class="article_list" id="articles_' + i + '">' +
            getArticles(obj[i].articles) +
            '</div>' +
            '</li>';
    }
    html += '</ul>';

    document.getElementById(elementId).innerHTML = html;
}

function getArticles(articles) {
    let html = '';
    for (let i = 0; i < articles.length; i++) {
        let title = articles[i].article_name;
        if (title == null || title == '') {
            title = '[タイトルなし]';
        }
        html += i + 1 + '. ' + '<a href="' +
            escapeHtml(articles[i].article_url) + '" target="_blank" rel="noopener">' +
            escapeHtml(title) + '</a><br>';
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
