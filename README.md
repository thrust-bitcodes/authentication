Authentication
===============

Authentication é um *bitcode* de autenticação/autorização para [thrust](https://github.com/thrustjs/thrust) que utiliza JWT *(JSON Web Token)* como mecanismo principal.

# Instalação

Posicionado em um app [thrust](https://github.com/thrustjs/thrust), no seu terminal:

```bash
thrust install authentication
```

## Tutorial

Primeiro vamos configurar nosso arquivo de inicialização *startup.js*, nele devemos fazer *require* do *authentication* e adicioná-lo como middleware do bitcode *router*, como mostrado abaixo:

```javascript
//Realizamos o require dos bitcodes
var server = require('http')
var router = require('router')
var auth   = require('authentication')

//Adicionamos o middleware de autenticação
router.addMiddleware(auth)

//Iniciamos o servidor
server.createServer(8778, router)
```

Em seguida, devemos utilizar os métodos do *authentication* que criam e destroem uma autenticação, geralmente acontece em um endpoint de login, como mostrado abaixo:

```javascript
//Rota de auth

//Realizamos o require do bitcode de autenticação
var auth   = require('authentication')

//Implementação do endpoint de login
function login (params, request, response) {

  //Checamos os parametros no banco ou qualquer outra fonte de dados.
  //Usamos apenas um if para exemplificação.
  if (params.name == 'admin' && params.password == 'admin') {

    //Criamos uma autenticação para esse usuário
    auth.createAuthentication(params, request, response, 1, 'idDoApp', {name: params.nome, role: 'admin'})

    //Respondemos ao client que deu tudo certo.
    response.json({loginOk: true})
  } else {

    //Respondemos ao client que o login falhou.
    response.json({loginOk: false, message: 'Usuário ou senha incorretos.'})
  }
}

//Implementação do endpoint de logout
function logout (params, request, response) {

  //Destruímos a autenticação
  auth.destroyAuthentication(params, request, response)
}

//Exportamos os endpoints
exports = {
  login: login,
  logout: logout
}
```

Note que, ao criar uma autenticação válida, é possível passar, como último parâmetro da função _createAuthentication_, um objeto com dados que podem ser acessados em qualquer _endpoint_, através da propriedade _userData_ no objeto _request_. Vejo abaixo como fazer isso:

```javascript
//Criando autenticação e definindo os parâmetros "name" e "role" na sessão.
auth.createAuthentication(params, request, response, 1, 'idDoApp', {name: params.nome, role: 'admin'})

//Lendo os valores das propriedades "name" e "role" informadas na criação da autenticação.
function inserirProduto(params, request, response) {
  console.log(params.userData.name)
  console.log(params.userData.role)

  //...
}
```

## API

```javascript
/**
* Cria um token de autenticação e o adiciona em um cookie, no header da resposta
* @param {Object} params - Parâmetros da requisição
* @param {Object} request - Request da requisição
* @param {Object} response - Response da requisição
* @param {Object} userId - Id do usuário
* @param {Object} appId - Id da aplicação (nota: uma aplicação pode conter vários ids)
* @param {Object} data - Dados que serão incluídos no token e disponibilizados em 'request.userData'
* @example
* @file login-endpoint.js
* @code authentication.createAuthentication(params, request, response, 341, 'mobileApp1', {profile: 'admin'})
*/
createAuthentication(params, request, response, userId, appId, data)

/**
* Destrói um autenticação caso ele exista
* @param {Object} params - Parâmetros da requisição
* @param {Object} request - Request da requisição
* @param {Object} response - Response da requisição
* @example
* @file logout-endpoint.js
* @code authentication.destroyAuthentication(params, request, response)
*/
destroyAuthentication(params, request, response)

/**
* Middleware que deve ser usado para ativar o módulo de autenticação
* @example
* @file startup.js
* @code router.addMiddleware(auth.validateAccess) //Nota: É recomendável que seja o primeiro middleware da aplicação
*/
validateAccess(params, request, response)

/**
* Seta uma função a ser chamada para definir se um token expirado pode ser revalidado.
* @example
* @file startup.js
* @code
* authentication.setCanRefreshTokenFn(function(token) {
*   return true
* })
*/
setCanRefreshTokenFn(newFn)
```

## Parâmetros de configuração
As propriedades abaixo devem ser configuradas no arquivo *config.json*:

``` javascript
...
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
      "accessTokenTTL": 300000 // 5 minutos, padrão para todos apps
      "refreshTokenTTL": {
          "central": 28800000 // 8 horas, para o app "central" apenas
      }
    }
    "jwt": {
      "jwsKey": "abcdefgh12345678",
    }
}
```
Acesse também os outros *bitcodes* utilizados no exemplo para melhor entendimento:

- [thrust-bitcodes/http](https://github.com/thrust-bitcodes/http)
- [thrust-bitcodes/router](https://github.com/thrust-bitcodes/router)

