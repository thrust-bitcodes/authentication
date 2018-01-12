/*
 * @Author: Cleverson Puche & Leandro Schmitt
 * @Date: 2017-09-15 08:41:25
 */

/**
* @description
* Module for authentication and authorization
*/
var Authentication = function () {
  var jwt = require('thrust-bitcodes/jwt')

  var authenticationConfig = getBitcodeConfig('authentication')
  var appName = getConfig().appName

  var DEFAULT_ACCESS_TOKEN_TTL = 5 * (1000 * 60)        //5m
  var DEFAULT_REFRESH_TOKEN_TTL = 8 * (1000 * 60 * 60)  //8h

  //TODO: Ver se isso também não precisa ser por app
  var _notAuthenticatedUrls = authenticationConfig('notAuthenticatedUrls') || []
  var _canRefreshTokenFn = function (token) {
    return true
  }

  /**
   * Create a valid authentication token and put it into a cookie inside response's header
   * @param {Object} params - thrust params object
   * @param {Object} request - thrust request object
   * @param {Object} response - thrust response object
   * @param {Object} userId - user id
   * @param {Object} appId - application id (note: an application name could have many application ids)
   * @param {Object} data - some additional data that will be available in each request
   * @example
   * authentication.createAuthentication(params, request, response, 341, 'mobileApp1', {profile: 'admin'})
   */
  this.createAuthentication = function (params, request, response, userId, appId, data) {
    var tkn = jwt.serialize({
      // Registred Claims - RFC 7519 - JWT
      exp: new Date().getTime() + getAccessTokenTTL(appId),
      iss: appName,
      // Custom Data
      rtexp: new Date().getTime() + getRefreshTokenTTL(appId),
      udata: {
        app: appId,
        sub: userId,
        data: data
      }
    }, true)

    setTokenIntoHeader(params, request, response, tkn)
    print('AUTHENTICATION INFO: Authentication created for user id: ' + userId + ' (' + new Date() + ')')
  }

  /**
   * Destroy a valid authentication token if it exists
   * @param {Object} params - thrust params object
   * @param {Object} request - thrust request object
   * @param {Object} response - thrust response object
   * @example
   * authentication.destroyAuthentication(params, request, response)
   */
  this.destroyAuthentication = function (params, request, response) {
    setTokenIntoHeader(params, request, response, 'undefined')
  }

  /**
   * Middleware to be used for authentication and authorization
   * @example
   * http.middlewares.push(securityAuth.validateAccess) //should to be the first middleware to be pushed
   */
  this.validateAccess = function (params, request, response) {
    if (!isAuthenticatedUrl(request)) {
      return true
    }

    try {
      proccessAndValidateToken(params, request, response)
      return true
    } catch (error) {
      print(error)
      notAuthenticated(response)
      return false
    }
  }

  /**
   * Set a function to be called to authorize AccessToken to be renoved
   * @example
   * authentication.setCanRefreshTokenFn(function(token) {
   *  var canRefresh = true //business rule using token param
   * })
   */
  this.setCanRefreshTokenFn = function (newFn) {
    _canRefreshTokenFn = newFn
  }

  var notAuthenticated = function (response) {
    print('AUTHENTICATION ERROR: Not Authenticated (' + new Date() + ')')
    response.json({
      message: 'Authentication Error: Not Authenticated',
      status: 401
    }, 401)
  }

  var isAuthenticatedUrl = function (request) {
    var uri = request.requestURI

    if (!Object.prototype.toString.call(_notAuthenticatedUrls) === '[object Array]') {
      _notAuthenticatedUrls = [_notAuthenticatedUrls]
    }

    return _notAuthenticatedUrls.indexOf(uri) < 0
  }

  var isAccessTokenAlive = function (token) {
    if (token.exp && token.exp >= new Date().getTime()) {
      return true
    } else {
      return false
    }
  }

  var isRefreshTokenAlive = function (token) {
    if (token.rtexp && token.rtexp >= new Date().getTime()) {
      return true
    } else {
      return false
    }
  }

  var proccessAndValidateToken = function (params, request, response) {
    var tknAppName = getTokenName(params, request)
    var token = readToken(request, tknAppName)

    if (!isAccessTokenAlive(token)) {
      tryToRefreshToken(params, request, response, token)
    }

    request.userData = token.udata
  }

  var tryToRefreshToken = function (params, request, response, token) {
    if (!isRefreshTokenAlive(token)) {
      throw new Error('Authentication Error: RefreshToken is expired (' + new Date() + ')')
    }

    if (!_canRefreshTokenFn(token)) {
      throw new Error('Authentication Error: Access denied when trying to refresh token (' + new Date() + ')')
    }

    token.exp = new Date().getTime() + getAccessTokenTTL(token.udata.app)
    token.rtexp = new Date().getTime() + getRefreshTokenTTL(token.udata.app)

    setTokenIntoHeader(params, request, response, jwt.serialize(token, true))
  }

  var getRefreshTokenTTL = function (app) {
    return authenticationConfig('refreshTokenTTL', app) || DEFAULT_REFRESH_TOKEN_TTL
  }

  var getAccessTokenTTL = function (app) {
    return authenticationConfig('accessTokenTTL', app) || DEFAULT_ACCESS_TOKEN_TTL
  }

  var extractToken = function (request, name) {
    var cookies = request.cookies
    for (var i = 0; i < cookies.length; i++) {
      if (cookies[i].getName() === name) {
        return cookies[i].getValue()
      }
    }
  }

  var readToken = function (request, name) {
    var tkn = extractToken(request, name || 'tkn')
    var deserializedToken = jwt.deserialize(tkn, true)
    return JSON.parse(deserializedToken)
  }

  var setTokenIntoHeader = function (params, request, response, serializedToken) {
    var tknAppName = getTokenName(params, request)

    var cookieStr = tknAppName + '=' + serializedToken + ';HttpOnly;path=/;' + (authenticationConfig('useSecureAuthentication') ? 'secure;' : '')

    response.addHeader('Set-Cookie', cookieStr)
  }

  var getTokenName = function (params, request) {
    return params['tknAppName'] || request.headers['tknAppName'] || 'tkn'
  }
}

var authentication = authentication || new Authentication()
exports = authentication
