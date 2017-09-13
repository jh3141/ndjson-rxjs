## Newline delimited JSON streaming in RxJS

A parser for [Newline-delimited JSON](http://specs.okfnlabs.org/ndjson/) that
uses an XMLHttpRequest as source and delivers the parsed objects as values in
an RxJS Observable.  The advantage of this over more traditional approaches
to JSON or similar APIs is that the client does not need to wait for all data
to be available before processing can begin; downloaded objects are delivered
as soon as the lines that contain them have fully downloaded.

## Installation and importing

`npm install ndjson-rxjs --save`

We recommend using [Babel](https://babeljs.io/blog/2015/10/31/setting-up-babel-6)
to allow using ES6 modules in your project; if you do this you can use the
following line to import the parser:

`import * as NDJsonRxJS from 'ndjson-rxjs';`

This will create an object `NDJsonRxJS` that contains the functions described
below.  For most purposes, you are only likely to need the `stream` function;
if its name doesn't conflict with anything in your project, you could import it
only using the simpler:

`import { stream } from 'ndjson-rxjs';`

Or, if there is a conflict:

`import { stream as ndjsonStream } from 'ndjson-rxjs';`

If you're still using `require` rather than ES6 modules, the equivalent of the
first method of importing above is:

`var NDJsonRxJS = require('ndjson-rxjs');`

## Usage

The main function provided is `NDJsonRxJS.stream (url, [options])`.  With no
specified options this downloads the requested URL with a GET request, and
returns an `Observable` that will provide the contained JSON objects, one at
a time.  Empty lines are ignored.

Supported options are:

* `method` - to specify an HTTP method other than `GET`
* `postData` - to specify data to send with the request
* `beforeOpen` - a callback function that can be used to customize the
  XMLHttpRequest object (which is passed as its first argument)
* `xhrFactory` - a callback which can be used to provide an alternative
  way of constructing an XMLHttpRequest object (default is to just use
  `new XMLHttpRequest();`)

There are two other functions exported that could be useful in some situations,
e.g. if building another similar protocol.

`NDJsonRxJS.extractStream(xhr, [options])` takes an XMLHttpRequest object
and returns an `Observable` that provides blocks of text as they are downloaded.
The `options` object currently has only one valid option: if `endWithNewline`
is set to `true` a newline will be appended if the final chunk of the stream
did not end with one.

`NDJsonRxJS.collate (observable)` is a filter on an observable that takes
chunks of text and returns arrays of complete lines.  Note that if the final
chunk of text does not end in a newline, the last line will not be returned,
so using the `endWithNewline` option to `extractStream` to produce the source
observable is sensible here.
