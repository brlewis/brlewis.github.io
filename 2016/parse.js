function parseResult(str) {
    try {
        return 'Parsed: ' + JSON.stringify(JSON.parse(str));
    } catch (e) {
        return e.message;
    }
}

function showParseResult() {
    document.querySelector('p').innerText = parseResult(document.querySelector('textarea').value);
}
