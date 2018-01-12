Authentication
===============

Authentication é um *bitcode* de autenticação/autorização para [ThrustJS](https://github.com/thrustjs/thrust) que utiliza JWT *(JSON Web Token)* como mecanismo principal.

## Tutorial

```javascript
var auth = require('thrust-bitcodes/authentication')
```

O modulo auth conterá os seguintes métodos

```javascript
/**
* Create a valid authentication token and put it into a cookie inside response's header
* @param {Object} params - thrust params object
* @param {Object} request - thrust request object
* @param {Object} response - thrust response object
* @param {Object} userId - user id
* @param {Object} appId - application id (note: an application name could have many application ids)
* @param {Object} data - some additional data that will be available in each request
* @example
* @file login-endpoint.js
* @code authentication.createAuthentication(request, response, 341, 'mobileApp1', {profile: 'admin'})
*/
createAuthentication(params, request, response, userId, appId, data)

/**
* Destroy a valid authentication token if it exists
* @param {Object} params - thrust params object
* @param {Object} request - thrust request object
* @param {Object} response - thrust response object
* @example
* @file logout-endpoint.js
* @code authentication.destroyAuthentication(request, response)
*/
destroyAuthentication(params, request, response)

/**
* Middleware to be used for authentication and authorization
* @example
* @file startup.js
* @code http.middlewares.push(securityAuth.validateAccess) //should to be the first middleware to be pushed
*/
validateAccess(params, request, response)

/**
* Set a function to be called to authorize AccessToken to be renoved
* @example
* @file startup.js
* @code
* authentication.setCanRefreshTokenFn(function(token) {
*  var canRefresh = true //business rule using token param
* })
*/
function setCanRefreshTokenFn(newFn)
```

## Parâmetros de configuração
As propriedades abaixo devem ser configuradas no arquivo *config.json* (distribuído juntamente com o ThrustJS):

``` javascript
"appName": /*String*/,
"authentication": { /*Configuração do authentication*/
  "notAuthenticatedUrls": /*String or StringArray*/,
  "useSecureAuthentication": /*Boolean (Sould to be True in production)*/,
  "accessTokenTTL": /*Number or Object with appID*/,
  "refreshTokenTTL": /*Number or Object with appID*/,
},
"jwt": { /*Configuração do jwt*/
  "jwsKey": /*String*/
}
```

Exemplo:

```javascript
/**
@file config.json
*/
{
    "appName": "MyApp",
    "authentication": {
      "notAuthenticatedUrls": [
        "/@auth/login",
        "/@auth/activate",
      ],
      "useSecureAuthentication": true,
      "accessTokenTTL": 300000 // 10 minutos, padrão para todos apps
      "refreshTokenTTL": {
          "central": 28800000 // 8 horas, para o app "central" apenas
      }
    }
    "jwt": {
      "jwsKey": "abcdefgh12345678",
    }
}
```
