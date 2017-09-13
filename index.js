/*
 * Copyright 2017 Julian Hall
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import Rx from 'rxjs';

/*
 * collate(stream)
 *
 * Translate a stream of chunks of text into a stream of arrays of lines of text.
 * Does not include any text after the last newline, so ensure the input is
 * newline-terminated as well as delimited.
 */
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

/*
 * extractStream (xhr, [options])
 *
 * Listen to download progress events on an XMLHttpRequest and provide the
 * response text in chunks as it is downloaded.  Options can contain the
 * flag "endWithNewline: true" which adds a trailing newline if one did not
 * exist in the source.
 */
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

/*
 * stream (url, options)
 *
 * Download line-delimited JSON from specified URL and deliver as an Observable.
 * Options are: method - defaults to GET, postData - default none,
 * xhrFactory - function to supply the XMLHttpRequest used (defaults to
 * new XMLHttpRequest), and beforeOpen - function called before xhr.open() to
 * allow for user-specified customization of the request.
 */
export function stream (url, options = {})
{
    let xhr = options.xhrFactory ?
        options.xhrFactory (url, options) :
        new XMLHttpRequest ();

    let textStream = extractStream (xhr, { endWithNewline: true });
    let jsonStream = collate(textStream)
                        .concatMap (lineArray => Rx.Observable.from(lineArray)) // replace array of items with sequence
                        .map(JSON.parse);

    if (options.beforeOpen) options.beforeOpen(xhr);

    xhr.open (options.method ? options.method : "GET", url);
    xhr.send (options.postData ? options.postData: null);

    return jsonStream;
}
