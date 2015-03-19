json-silo
=========


A data silo for JSON compatible with Smart Spaces
-------------------------------------------------

json-silo is a datastore for JSON objects, and is the base piece in the json-silo - [hlc-server](https://www.npmjs.org/package/hlc-server) - [smartspaces](https://www.npmjs.org/package/smartspaces) stack.  The easiest way to learn how these all fit together is our [Make a Smart Space tutorial](http://reelyactive.github.io/make-a-smartspace.html).

Visit [myjson.info](http://myjson.info) for a live demo.


Installation
------------

    npm install json-silo


Hello JSON Silo
---------------

```javascript
var server = require('json-silo');
var app = new server();
```

Then browse to [http://localhost:3002](http://localhost:3002) to see the landing page.

Browse to [http://localhost:3002/id/test](http://localhost:3002/id/test)) to see the following test output:

    {
      person: {
        firstName: "Barn",
        lastName: "Owl",
        companyName: "reelyActive",
        portraitImageUrl: "http://reelyactive.com/images/barnowl.jpg",
        twitterPersonalScreenName: "reelyActive"
      },
      device: {
        manufacturer: "reelyActive",
        model: "RA-T411",
        portraitImageUrl: "http://reelyactive.com/images/tag400x400.jpg"
      }
    }


Querying the JSON Silo
----------------------

To query the JSON stored under the identifier 1a2b3c4d5e6f make the following request:

- [http://localhost:3002/id/1a2b3c4d5e6f](http://localhost:3002/id/1a2b3c4d5e6f)

To query the real-time context of a place named _thebarn_ make the following request (see [hlc-server](https://www.npmjs.org/package/hlc-server) for the output format):

- [http://localhost:3002/at/thebarn](http://localhost:3002/at/thebarn)

If a valid place is queried, but no one is there, the API will provide an "ok" response and include a lonely device as a placeholder.


Options
-------

The following options are supported when instantiating json-silo (those shown are the defaults):

    {
      httpPort: 3002,
      useCors: false,
      hlcServerUrl: "http://localhost:3001",
      smartspacesUrl: "http://localhost:3000",
      places: [ { title: "The Barn", value: "test" },
                { title: "-", value: "" } ],
      durations: [ { title: "1 hour", value: "1h" },
                   { title: "4 hours", value: "4h" },
                   { title: "12 hours", value: "12h" },
                   { title: "24 hours", value: "24h" } ],
      password: null
    }

Notes:
- durations require the value to be a number followed by m, h or d (minutes, hours and days, respectively)
- setting a (non-null) password will prompt a login when users attempt to add data to the JSON silo


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!


License
-------

MIT License

Copyright (c) 2014 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

