json-silo
=========


A data silo for JSON compatible with Smart Spaces
-------------------------------------------------

json-silo is a datastore for user and smartspace data. It allows the storage of data (_such as names, addresses, emails, telephones, etc._) which can be classified as public or private. If two silos have agreed to an information exchange, the json-silo facilitates the exchange between them through the reelyActive service. The json-silo can be seen as a simplified [personal data locker](http://en.wikipedia.org/wiki/Locker_%28software%29).

All data is stored in [JSON-LD](http://json-ld.org/) format. This allows different silos to get a far greater understanding of the each others' information. This is because of the nature of [linked data](http://en.wikipedia.org/wiki/Linked_data) which allows data from different sources (_other than the json-silos themselves_) to be connected & queried. For example:

```json
{
  "@context": {
    "schema": "http://schema.org/",
    "productdb": "http://productdb.org/"
  },
  "@graph": [
    {
      "@id": "me",
      "@type": "schema:Person",
      "schema:name": "Joseph Stalin",
      "schema:owns":
        {
          "@id": "productdb:iphone5.html",
          "@type": "schema:Product",
          "schema:productID": "mac:01:23:45:67:89:ab"
        }
    }
  ]
}
```

By describing Joseph Stalin, I know that he is a Person who owns an iPhone5. I can then visit the url for the iPhone5 (_productdb:iphone5.html == http://productdb.org/iphone5.html_) to find out more about it. This url may in turn contain other links which allow me to know where it was manufactured, designed, etc.


Installation
------------

    npm install json-silo
    

Hello JSON Silo
---------------

```javascript
var server = require('json-silo');
var app = new server();
```

RESTful interactions
--------------------

Include _Content-Type: application/json_ in the header of all interactions in which JSON is sent to the json-silo.

__PUT /login__

Logs in the User. If no User exists, it creates a new one. This query returns a [JSON Web Token (JWT)](http://jwt.io/) which should be used in subsequent queries for authentication using the *bearer* strategy. For example, to login a User, include the following JSON:

```json
{ "email": "email@test.com", "password": "pass" }
```

This, will produce the following response:

```json
{
    "_meta": {
        "message": "ok",
        "statusCode": 200
    },
    "_links": {
        "self": {
            "href": "http://localhost:3002/login"
        }
    },
    "data": "eyJhbGciOiJIUzI1NiJ9.YXdQdG92ZWhaczFZV3FlNw.cXJSh34Dk50cpCB6vV8zN1tQ6jSTuti1rExN-20Wm0A"
}
```
The String in the data field represents the JWT token. It should be used in subsequent requests by adding it to the header: _Authorization: Bearer YOURTOKEN_  

__GET /__

Retrieve the public data associated with this silo. For example, this is a typical response:

```json
{
    "_meta": {
        "message": "ok",
        "statusCode": 200
    },
    "_links": {
        "self": {
            "href": "http://localhost:3002/"
        }
    },
    "data": {
        "public": {
            "@context": {
                "schema": "http://schema.org/",
                "dbpedia": "http://dbpedia.org/page/",
                "productdb": "http://productdb.org/"
            },
            "@type": "schema:Person",
            "schema:image": "http://communits/stalin.jpg"
        },
        "private": [
            "@id",
            "schema:name",
            "schema:owns"
        ]
    }
}
```

__PUT /__

Replace the fields which are set as public. Only the authorised User can perform this action. Therefore, the authorization token must be set in the header (_check the /login query_). 
For example, to set the *schema:owns* as public, include the following JSON:

```json
{ "public" : ["schema:owns"] }
```
__PUT /reelyActive__

Registers the silo for the reelyActive service. The request returns a token which should be given to reelyActive to handle the transactions. Only the authorised User can perform this action and must therefore provide a JWT token.

__DELETE /reelyActive__

Un-registers the silo from the reelyActive service. Only the authorised User can perform this action and must therefore provide a JWT token.


__PUT /keys__

Generate a new public/private key pair. These are used for encryption during data exchanges between different silos through the reelyActive service. Only the authorised User can perform this action and must therefore provide a JWT token. For extra security, the User must also provide his/her password. For example, include the following JSON:

```json
{ "password": "pass" }
```

__GET /data__

Retrieve the User data. Only the authorised User can perform this action and must therefore provide a JWT token.

__PUT /data__

Replace the User data. Only the authorised User can perform this action and must therefore provide a JWT token. The data must be provided in valid JSON-LD format (_you can use the [JSON-LD playground](http://json-ld.org/playground/index.html) or [google's testing tool](https://developers.google.com/structured-data/testing-tool/) to validate your data_). For example, include the following JSON:

```json
{
  "jsonLD" : 
  {
    "@id": "index.html",
    "@type": "schema:Person",
    "schema:name": "Joseph Stalin",
    "schema:image": "http://communits/stalin.jpg",
    "schema:owns": [
      {
        "@id": "productdb:iphone5.html",
        "@type": "schema:Product",
        "schema:productID": "mac:01:23:45:67:89:ab"
      }
    ]
  }
}
```
Note that the context is added automatically. We are using, by default, the following context:
```json
"@context": {
    "schema": "http://schema.org/",
    "dbpedia": "http://dbpedia.org/page/",
    "productdb": "http://productdb.org/"
}
```

__GET /transactions__

Retrieve all transactions requested and performed by reelyActive. reelyActive or the User may perform this action and must therefore provide their respctive JWT tokens.

__POST /transactions__

Create a new transaction. The silo encrypts the data requested and sends it to reelyActive. Only reelyActive may perform this action and must therefore provide a JWT token. reelyActive must also specify which fields to get, the public key & url of the silo requesting and a transaction ID. For example, include the following JSON:


```json
{
    "pubkey" : "SOME_PUBLIC_KEY",
    "fields" : ["@type", "@id"],
    "transactionId" : "someId",
    "requestorURI" : "http://stalker.com"
}
```

Options
-------

The following options are supported when instantiating the json-silo (those shown are the defaults):

    {
      httpPort: 3004,
    }


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

