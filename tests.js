import test from 'tape';
import * as NDJsonRxJS from './index.js';
import Rx from 'rxjs';

test("record collator does not send data before first newline", { timeout: 100 }, assert => {
    assert.plan(1);
    let receivedData = false;
    let subject = Rx.Observable.of("some data with no newlines", "more data with no newlines");
    let stream = NDJsonRxJS.collate(subject);
    stream.subscribe(data => { receivedData = data; });

    assert.equals (receivedData, false);
});


test("record collator sends data up to first newline", { timeout: 100 }, assert => {
    assert.plan(1);
    let receivedData = false;
    let subject = Rx.Observable.of("data with a newline\nhere");
    let stream = NDJsonRxJS.collate(subject);
    stream.subscribe(data => { receivedData = data; });
    assert.deepEquals (receivedData, [ "data with a newline" ]);
});

test("multiple data items accumulated up to first newline", { timeout: 100 }, assert => {
    assert.plan(1);
    let receivedData = false;
    let subject = Rx.Observable.of("no newline here ", "data with a newline\nhere");
    let stream = NDJsonRxJS.collate(subject);
    stream.subscribe(data => { receivedData = data; });
    assert.deepEquals (receivedData, [ "no newline here data with a newline" ]);
});

test("data after newline accumulated until next newline available", { timeout: 100 }, assert => {
    assert.plan(1);
    let receivedData = false;
    let subject = Rx.Observable.of("newline\nhere ", "and also\nhere");
    let stream = NDJsonRxJS.collate(subject);
    stream.subscribe(data => { receivedData = data; });
    assert.deepEquals (receivedData, [ "here and also" ]);
});

test("multiple lines in same origin buffer handled correctly", { timeout: 100 }, assert => {
    assert.plan(1);
    let receivedData = false;
    let subject = Rx.Observable.of("multiple newlines here\nand here\nand not here");
    let stream = NDJsonRxJS.collate(subject);
    stream.subscribe(data => { receivedData = data; });
    assert.deepEquals (receivedData, [ "multiple newlines here", "and here" ]);
});

test("extractStream forwards content available so far on first notification", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let results = [];
    NDJsonRxJS.extractStream(mockxhr).subscribe(data => results.push(data));
    mockxhr.responseText = "first chunk of content here";
    mockxhr.readyState = 3;
    mockxhr.onreadystatechange();
    assert.deepEquals (results, ["first chunk of content here"]);
});

test ("extractStream reacts to progress events as well as readystatechanges", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let results = [];
    NDJsonRxJS.extractStream(mockxhr).subscribe(data => results.push(data));
    mockxhr.responseText = "first chunk of content here";
    mockxhr.readyState = 3;
    mockxhr.onprogress();
    assert.deepEquals (results, ["first chunk of content here"]);
});

test("extractStream collects additional data in new item", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let results = [];
    NDJsonRxJS.extractStream(mockxhr).subscribe(data => results.push(data));
    mockxhr.responseText = "first chunk of content here";
    mockxhr.readyState = 3;
    mockxhr.onreadystatechange();
    mockxhr.responseText += "second chunk here";
    mockxhr.onprogress();
    assert.deepEquals (results, ["first chunk of content here", "second chunk here"]);
});

test ("extractStream closes the stream when download complete", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let finished = false;
    NDJsonRxJS.extractStream(mockxhr).subscribe(data => {}, error => {}, complete => { finished = true; });
    mockxhr.responseText = "";
    mockxhr.readyState = 4;
    mockxhr.onreadystatechange();
    assert.ok(finished, "should have called complete function");
});

test ("extractStream should propagate errors", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let errorResult = false;
    NDJsonRxJS.extractStream(mockxhr).subscribe(data => {}, error => { errorResult = error; }, complete => {});
    mockxhr.onerror ("error");
    assert.equals(errorResult, "error");
});

test ("extractStream with option 'endWithNewline: true' adds a newline when last block didn't end with one", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let results = [];
    NDJsonRxJS.extractStream (mockxhr, { endWithNewline: true }).subscribe(data => results.push(data));
    mockxhr.responseText = "content here";
    mockxhr.readyState = 3;
    mockxhr.onreadystatechange();
    mockxhr.readyState = 4;
    mockxhr.onreadystatechange ();

    assert.deepEquals (results, ["content here", "\n"]);
});

test ("extractStream with option 'endWithNewline: true' doesn't a newline when last block did end with one", { timeout: 100 }, assert => {
    assert.plan (1);
    let mockxhr = {};
    let results = [];
    NDJsonRxJS.extractStream (mockxhr, { endWithNewline: true }).subscribe(data => results.push(data));
    mockxhr.responseText = "content here\n";
    mockxhr.readyState = 3;
    mockxhr.onreadystatechange();
    mockxhr.readyState = 4;
    mockxhr.onreadystatechange ();

    assert.deepEquals (results, ["content here\n"]);
});

test ("integrated process builds an XMLHttpRequest (with specified factory) and delivers stream of JSON objects", { timeout: 100 }, assert => {
    assert.plan (1);
    let results = [];
    let xhr = {};
    xhr.open = (method, url) => {};
    xhr.send = (postData) => {};
    NDJsonRxJS.stream("http://example.com/mytest", {
        xhrFactory: (url, options) => {
            return xhr;
        }
    }).subscribe (data => results.push(data));
    xhr.responseText = "{ \"test\": \"data\" }\n{ \"second\": \"t";
    xhr.readyState = 3;
    xhr.onreadystatechange ();
    xhr.responseText += "est\" }\n{ \"third\": 3 }\n\n{ \"fourth\": \"four\" }";
    xhr.onprogress ();
    xhr.readyState = 4;
    xhr.onreadystatechange ();

    assert.deepEquals (results, [ { test: "data" }, { second: "test" }, { third: 3 }, { fourth: "four" } ]);
});

// FIXME should test that various XHR-related options can be set.
