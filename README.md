json-silo
=========


A contextual data silo for the IoT and the Physical Web
-------------------------------------------------------

json-silo is a datastore for JSON stories.  You can think of it as a personal data locker.  A json-silo allows a user to enter contextual information about themselves, which it then converts and stores as machine-readable JSON-LD and Schema.org.  This information is available to anyone with the URL (hyperlink).  Why would anyone want to share this info via an API?  So that they may be recognised for what matters to them!  Learn more about storytelling through reelyApp and the json-silo via [our website](https://www.reelyactive.com/reelyapp/).

### In the scheme of Things (pun intended)

Visit [myjson.info](https://myjson.info) for a live demo, including [myjson.info/stories/test](https://myjson.info/stories/test), a story which you can query both as human-friendly HTML or as machine-friendly JSON.

![json-silo logo](https://reelyactive.github.io/json-silo/images/json-silo-bubble.png)


What's in a name?
-----------------

The json-silo is exactly that: a data silo for [JSON](https://en.wikipedia.org/wiki/JSON)!  Simple enough, right?  So why does it have a grain silo with a hockey mask for a mascot?

At reelyActive we've always been outspoken about the need for an open Internet of Things as opposed to a bunch of siloed applications.  In 2013, on social media we recycled the ["More cowbell" meme](https://en.wikipedia.org/wiki/More_cowbell) with an image of Will Ferrell banging on a grain silo with the caption ["The Internet of Things does not need More Silo"](https://reelyactive.github.io/images/moreSilo.jpg).  When it came time to create a mascot for the json-silo, we decided to start with that grain silo.

Now, how do you visually represent JSON in association with a grain silo?  Sure, we could have slapped the official JSON logo on that silo, but where's the fun in that?  Instead, for those of us who grew up in the eighties, hearing "JSON" out of context (pun intended) evokes the image of [Jason Voorhees](https://en.wikipedia.org/wiki/Jason_Voorhees) from the Friday the 13th series of films, specifically the iconic hockey goaltender mask he wore.  Not only does that "Jason" mask make for a silly visual pun, it also gives a nod to our hometown heritage, where [Jacques Plante](https://en.wikipedia.org/wiki/Jacques_Plante) of the Montreal Canadiens was the first goaltender to wear such a mask full-time, which would later become standard practice.  We'd be pleased to see the use of personal data lockers become standard practice too.


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

![json-silo landing page](https://www.reelyactive.com/images/json-silo-flow.gif)


Browse to [http://localhost:3002/stories/test](http://localhost:3002/stories/test)) to see the following test output:

    {
      "@context": {
        "schema": "http://schema.org/"
      },
      "@graph": [
        {
          "@id": "person",
          "@type": "schema:Person",
          "schema:givenName": "Barn",
          "schema:familyName": "Owl",
          "schema:worksFor": "reelyActive",
          "schema:image": "https://reelyactive.com/images/barnowl.jpg",
          "schema:jobTitle": "Mascot",
          "schema:url": "https://www.npmjs.com/package/barnowl",
          "schema:sameAs": [
            "https://www.instagram.com/reelyactive/"
          ]
        },
        {
          "@id": "product",
          "@type": "schema:Product",
          "schema:name": "915MHz Active RFID Tag",
          "schema:manufacturer": {
            "@type": "schema:Organization",
            "schema:name": "reelyActive"
          },
          "schema:model": "RA-T411",
          "schema:url": "https://shop.reelyactive.com/products/ra-t411",
          "schema:image": "https://reelyactive.com/images/tag400x400.jpg"
        }
      ]
    }


Querying the JSON Silo
----------------------

To query the JSON story with identifier 1a2b3c4d5e6f make the following request:

- [http://localhost:3002/stories/1a2b3c4d5e6f](http://localhost:3002/stories/1a2b3c4d5e6f)

To query the real-time context of a directory named _name_ make the following request (see [hlc-server](https://www.npmjs.org/package/hlc-server) for the output format):

- [http://localhost:3002/contextat/directory/name](http://localhost:3002/contextat/directory/name)

If a valid directory is queried, but no devices are present, the API will provide an "ok" response and include a lonely device as a placeholder.


Onboarding Stations and Directories
-----------------------------------

To add onboarding stations, include the following in the options upon instantiation:

    stations: [ { title: "Onboarding station name",
                  id: "001bc50940810000",
                  rssiThreshold: 185,
                  rssiFloor: 140 } ]

The default rssiThreshold is 185 and the onboarding process will consider the device with the strongest RSSI, which normally should be the device closest to the reelceiver with then given id.  The rssiFloor serves only for the visualisation of the percentage of the rssiThreshold reached during onboarding.

To add directories, include the following in the options upon instantiation:

    directories: [ { title: "Directory name", value: "name" } ]

This allows stories to be checked-in at the given directories until the stories themselves self-destruct.


Options
-------

The following options are supported when instantiating json-silo (those shown are the defaults):

    {
      httpPort: 3002,
      useCors: false,
      hlcServerUrl: "http://localhost:3001",
      smartspacesUrl: "http://localhost:3000",
      stations: [],
      directories: [ { title: "The Barn", value: "test" } ],
      durations: [ { title: "1 hour", value: "1h" },
                   { title: "4 hours", value: "4h" },
                   { title: "12 hours", value: "12h" },
                   { title: "24 hours", value: "24h" } ],
      password: null,
      secret: "YoureProbablyGonnaWantToChangeIt",
      identifierLength: 16,
      persistentDataFolder: "data"
    }

Notes:
- durations require the value to be a number followed by m, h or d (minutes, hours and days, respectively)
- setting a (non-null) password will prompt a login when users attempt to add data to the JSON silo
- persistentDataFolder specifies the path to the folder which contains the persistent database file (before v0.4.0 the default was "")


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!  If you're developing with json-silo check out:
* [diyActive](https://reelyactive.github.io/) our developer page
* our [node-style-guide](https://github.com/reelyactive/node-style-guide) for development
* our [contact information](https://www.reelyactive.com/contact/) to get in touch if you'd like to contribute


License
-------

MIT License

Copyright (c) 2014-2017 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

