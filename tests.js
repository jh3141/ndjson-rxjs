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
