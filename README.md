json-silo
=========


A lightweight digital twins store and API for the IoT
-----------------------------------------------------

The __json-silo__ is a digital twins store and an accessory module of [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) open source middleware for [context-aware physical spaces](https://www.reelyactive.com/context-aware-physical-spaces/).

Specifically, the __json-silo__ stores "stories" which are machine-readable representations of people, products, places, etc. in the form of JSON-LD and Schema.org.  Additionally, it provides a simple mechanism for file storage and retrieval, for any accompanying metadata such as images.  The __json-silo__ can run standalone, even on resource-constrained devices.


Installation
------------

    npm install json-silo


Hello json-silo!
----------------

    npm start

Browse to [localhost:3001/json-silo/](http://localhost:3001/json-silo/) and observe the json-silo logo.  Interact with the json-silo via its REST API.


REST API
--------

The __json-silo__'s REST API includes the following two base routes:
- /stories _for retrieving/specifying digital twins_
- /store _for storing and retrieving metadata such as /images_


### POST /stories

Create a story.  The _id_ of the created story is provided in the response.

#### Example request

| Method | Route    | Content-Type     |
|:-------|:---------|:-----------------|
| POST   | /stories | application/json |

    {
      "@context": {
        "schema": "https://schema.org/"
      },
      "@graph": [
        {
          "@id": "person",
          "@type": "schema:Person",
          "schema:givenName": "barnowl"
        }
      ]
    }

#### Example response

    {
      "_meta": {
        "message": "ok",
        "statusCode": 200
      },
      "_links": {
        "self": {
          "href": "http://localhost:3000/stories"
        }
      },
      "stories": {
        "barnowl": {
          "@context": {
            "schema": "https://schema.org/"
          },
          "@graph": [
            {
              "@id": "person",
              "@type": "schema:Person",
              "schema:givenName": "barnowl"
            }
          ]
        }
      }
    }


### GET /stories/{id}

Retrieve the story with the given _id_.

#### Example request

| Method | Route            | Content-Type     |
|:-------|:-----------------|:-----------------|
| GET    | /stories/barnowl | application/json |

#### Example response

    {
      "_meta": {
        "message": "ok",
        "statusCode": 200
      },
      "_links": {
        "self": {
          "href": "http://localhost:3000/stories/barnowl"
        }
      },
      "stories": {
        "barnowl": {
          "@context": {
            "schema": "https://schema.org/"
          },
          "@graph": [
            {
              "@id": "person",
              "@type": "schema:Person",
              "schema:givenName": "barnowl"
            }
          ]
        }
      }
    }


### POST /store/images

Upload an image to the store.  The _id_ (modified filename) of the uploaded image is provided in the response.  The image is modified using [sharp](https://github.com/lovell/sharp) to conform to standard dimensions before it is stored on the filesystem.

#### Example request

| Method | Route         | Content-Type        |
|:-------|:--------------|:--------------------|
| POST   | /store/images | multipart/form-data |


### GET /store/images/{id}

Retrieve the image with the given _id_ (filename).

#### Example request

| Method | Route                      | Content-Type        |
|:-------|:---------------------------|:--------------------|
| POST   | /store/images/12345678.jpg | multipart/form-data |


What's in a name?
-----------------

The __json-silo__ is exactly that: a data silo for [JSON](https://en.wikipedia.org/wiki/JSON)!  Simple enough, right?  So why does it have a grain silo with a hockey mask for a mascot?

At reelyActive we've always been outspoken about the need for an open Internet of Things as opposed to a bunch of siloed applications.  In 2013, on social media we recycled the ["More cowbell" meme](https://en.wikipedia.org/wiki/More_cowbell) with an image of Will Ferrell banging on a grain silo with the caption ["The Internet of Things does not need More Silo"](https://reelyactive.github.io/images/moreSilo.jpg).  When it came time to create a mascot for the __json-silo__, we decided to start with that grain silo.

Now, how do you visually represent JSON in association with a grain silo?  Sure, we could have slapped the official JSON logo on that silo, but where's the fun in that?  Instead, for those of us who grew up in the eighties, hearing "JSON" out of context (pun intended) evokes the image of [Jason Voorhees](https://en.wikipedia.org/wiki/Jason_Voorhees) from the Friday the 13th series of films, specifically the iconic hockey goaltender mask he wore.  Not only does that "Jason" mask make for a silly visual pun, it also gives a nod to our hometown heritage, where [Jacques Plante](https://en.wikipedia.org/wiki/Jacques_Plante) of the Montreal Canadiens was the first goaltender to wear such a mask full-time, which would later become standard practice.  We'd be pleased to see the use of personal data lockers become standard practice too.

![json-silo logo](https://reelyactive.github.io/json-silo/images/json-silo-bubble.png)


What's next?
------------

__json-silo__ v1.0.0 was released in August 2019, superseding all earlier versions, the latest of which remains available in the [release-0.5 branch](https://github.com/reelyactive/json-silo/tree/release-0.5) and as [json-silo@0.5.2 on npm](https://www.npmjs.com/package/json-silo/v/0.5.2).

__json-silo__ v1.1.0 migrates to [ESMapDB](https://github.com/reelyactive/esmapdb) from [NeDB](https://github.com/louischatriot/nedb).  If upgrading from a previous version, any stored stories will need to be recreated.


Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.


License
-------

MIT License

Copyright (c) 2014-2024 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

