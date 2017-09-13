import Rx from 'rxjs';

export function collate (stream)
{
    return stream.scan((state, data) => {
        let index = data.lastIndexOf('\n');
        if (index >= 0)
        {
            return {
                finishedLine: state.buffer + data.substring(0, index+1),
                buffer: data.substring(index+1)
            };
        }
        else
        {
            return { buffer: data };
        }
    }, { buffer: "" } ).filter(x => x.finishedLine).map(x => x.finishedLine.split('\n').filter (i => i.length > 0));
}

export function extractStream (xhr, options={})
{
    return Rx.Observable.create (observer => {
        let charactersSeen = 0;

        function notified () {
            if (xhr.readyState >= 3 && xhr.responseText.length > charactersSeen)
            {
                observer.next(xhr.responseText.substring(charactersSeen));
                charactersSeen = xhr.responseText.length;
            }
            if (xhr.readyState == 4)
            {
                if (options.endWithNewline && xhr.responseText[xhr.responseText.length - 1] != "\n")
                    observer.next("\n");
                observer.complete ();
            }
        }
        xhr.onreadystatechange = notified;
        xhr.onprogress = notified;
        xhr.onerror = event => { observer.error(event); };
    });

    return subject;
}

export function stream (url, options = {})
{
    let xhr = options.xhrFactory ?
        options.xhrFactory (url, options) :
        new XMLHttpRequest ();

    let textStream = extractStream (xhr, { endWithNewline: true });
    let jsonStream = collate(textStream)
                        .concatMap (lineArray => Rx.Observable.from(lineArray)) // replace array of items with sequence
                        .map(JSON.parse);

    xhr.open (options.method ? options.method : "GET", url);
    xhr.send (options.postData ? options.postData: null);

    return jsonStream;
}
