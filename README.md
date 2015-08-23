json-silo
=========


A contextual data silo for the IoT and Smart Spaces
---------------------------------------------------

json-silo is a datastore for JSON stories.  You can think of it as a personal data locker.  A json-silo allows a user to enter contextual information about themselves, which it then converts and stores as machine-readable JSON.  This information is available to anyone with the URL (hyperlink).  Why would anyone want to share this info via an API?  So that their information is shared via any Smart Space of course!  Learn more about storytelling through reelyActive Smart Spaces via [our website](http://context.reelyactive.com/start.html).

### In the scheme of Things (pun intended)

json-silo is the base piece in the json-silo - [hlc-server](https://www.npmjs.org/package/hlc-server) - [smartspaces](https://www.npmjs.org/package/smartspaces) stack.  The easiest way to learn how these all fit together is our [Make a Smart Space tutorial](http://reelyactive.github.io/make-a-smartspace.html) on our [developer page](http://reelyactive.github.io).

Visit [myjson.info](http://myjson.info) for a live demo and read [Host a JSON Silo](http://reelyactive.github.io/host-a-json-silo.html) to learn how easy it is to host your own silo!


![json-silo logo](http://reelyactive.com/images/json-silo.jpg)


What's in a name?
-----------------

The json-silo is exactly that: a data silo for [JSON](http://en.wikipedia.org/wiki/JSON)!  Simple enough, right?  So why does it have a grain silo with a hockey mask for a mascot?

At reelyActive we've always been outspoken about the need for an open Internet of Things as opposed to a bunch of siloed applications.  In 2013, on social media we recycled the ["More cowbell" meme](http://en.wikipedia.org/wiki/More_cowbell) with an image of Will Ferrell banging on a grain silo with the caption ["The Internet of Things does not need More Silo"](http://reelyactive.github.io/images/moreSilo.jpg).  When it came time to create a mascot for the json-silo, we decided to start with that grain silo.

Now, how do you visually represent JSON in association with a grain silo?  Sure, we could have slapped the official JSON logo on that silo, but where's the fun in that?  Instead, for those of us who grew up in the eighties, hearing "JSON" out of context (pun intended) evokes the image of [Jason Voorhees](http://en.wikipedia.org/wiki/Jason_Voorhees) from the Friday the 13th series of films, specifically the iconic hockey goaltender mask he wore.  Not only does that "Jason" mask make for a silly visual pun, it also gives a nod to our hometown heritage, where [Jacques Plante](http://en.wikipedia.org/wiki/Jacques_Plante) of the Montreal Canadiens was the first goaltender to wear such a mask full-time, which would later become standard practice.  We'd be pleased to see the use of personal data lockers become standard practice too.


Installation
------------

    npm install json-silo


Hello JSON Silo
---------------

```javascript
var server = require('json-silo');
var app = new server( { password: null } );
```

Then browse to [http://localhost:3002](http://localhost:3002) to see the landing page.

![json-silo landing page](http://reelyactive.com/images/json-silo-landing.png)


Browse to [http://localhost:3002/stories/test](http://localhost:3002/stories/test)) to see the following test output:

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

To query the JSON story with identifier 1a2b3c4d5e6f make the following request:

- [http://localhost:3002/stories/1a2b3c4d5e6f](http://localhost:3002/stories/1a2b3c4d5e6f)

To query the real-time context of a place named _thebarn_ make the following request (see [hlc-server](https://www.npmjs.org/package/hlc-server) for the output format):

- [http://localhost:3002/contextat/directory/thebarn](http://localhost:3002/contextat/directory/thebarn)

If a valid place is queried, but no one is there, the API will provide an "ok" response and include a lonely device as a placeholder.


Options
-------

The following options are supported when instantiating json-silo (those shown are the defaults):

    {
      httpPort: 3002,
      useCors: false,
      hlcServerUrl: "http://localhost:3001",
      smartspacesUrl: "http://localhost:3000",
      directories: [ { title: "The Barn", value: "test" },
                     { title: "-", value: "" } ],
      durations: [ { title: "1 hour", value: "1h" },
                   { title: "4 hours", value: "4h" },
                   { title: "12 hours", value: "12h" },
                   { title: "24 hours", value: "24h" } ],
      password: null,
      secret: "YoureProbablyGonnaWantToChangeIt"
    }

Notes:
- durations require the value to be a number followed by m, h or d (minutes, hours and days, respectively)
- setting a (non-null) password will prompt a login when users attempt to add data to the JSON silo


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!  If you're developing with json-silo check out:
* [diyActive](http://reelyactive.github.io/) our developer page
* our [node-style-guide](https://github.com/reelyactive/node-style-guide) for development
* our [contact information](http://context.reelyactive.com/contact.html) to get in touch if you'd like to contribute


License
-------

MIT License

Copyright (c) 2014-2015 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

