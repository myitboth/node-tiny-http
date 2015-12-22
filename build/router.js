// Generated by CoffeeScript 1.10.0
(function() {
  var Request, Response, Result, handler, match, register, routes,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Request = require('./request');

  Response = require('./response');

  Result = require('./result');

  routes = {};

  match = function(method, pattern) {
    var keys, r;
    keys = [];
    pattern = pattern.replace(/(:|%)([_a-z0-9-]+)/i, function(m, prefix, name) {
      keys.push(name);
      if (prefix === ':') {
        return '([^\\/]+)';
      } else {
        return '(.+)';
      }
    });
    r = new RegExp("^" + pattern + "$", 'g');
    return function(requestMethod, uri, params) {
      var i, j, len, result, val;
      if ((method != null) && requestMethod !== method) {
        return false;
      }
      result = r.exec(uri);
      r.lastIndex = 0;
      if (result != null) {
        for (i = j = 0, len = result.length; j < len; i = ++j) {
          val = result[i];
          if (i === 0) {
            continue;
          }
          params[keys[i - 1]] = val;
        }
        return true;
      }
      return false;
    };
  };

  register = function(method, pattern, actions) {
    var action, functions, j, len, tester;
    tester = match(method, pattern);
    functions = [];
    for (j = 0, len = actions.length; j < len; j++) {
      action = actions[j];
      if (indexOf.call(functions, action) < 0) {
        functions.push(action);
      }
    }
    return routes[pattern] = [tester, functions];
  };

  handler = function(results, options) {
    return function(req, res) {
      var response;
      response = new Response(res, options);
      return new Request(req, options, function(request) {
        var def, functions, index, next, params, pattern, result, tester;
        result = null;
        for (pattern in routes) {
          def = routes[pattern];
          tester = def[0], functions = def[1];
          params = {};
          index = -1;
          if (!tester(request.method, request.path, params)) {
            continue;
          }
          request.set(params);
          (next = function() {
            var fn;
            index += 1;
            fn = functions[index];
            return result = fn.call(results, request, response, next);
          })();
          break;
        }
        if (result == null) {
          result = results.blank();
        }
        result.call(null, request, response);
        return response.respond();
      });
    };
  };

  module.exports = {
    register: register,
    handler: handler
  };

}).call(this);
