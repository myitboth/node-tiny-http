Request = require './request'
Response = require './response'
Result = require './result'

# routes map
routes = {}

# default functions
defaults = []


# create match uri pattern
match = (method, pattern) ->
    keys = []

    # replace as regex
    pattern = pattern.replace /(:|%)([_a-z0-9-]+)/i, (m, prefix, name) ->
        keys.push name
        if prefix == ':' then '([^\\/]+)' else '(.+)'

    r = new RegExp "^#{pattern}$", 'g'

    (requestMethod, uri, params) ->
        return no if method? and requestMethod != method

        result = r.exec uri
        r.lastIndex = 0

        if result?
            # inject params
            for val, i in result
                continue if i == 0
                params[keys[i - 1]] = val
            return yes

        # not matched
        no


# register routes
register = (method, pattern, fn) ->
    tester = match method, pattern
    functions = []
    pushed = no

    routes[pattern] =
        get: ->
            if not pushed
                functions.push fn
                pushed = yes

            [tester, functions]
        use: (actions...) ->
            for action in actions
                if action instanceof Array
                    for item in action
                        functions.push item
                else
                    functions.push action


# register default functions
use = (actions...) ->
    for action in actions
        if action instanceof Array
            for item in action
                defaults.push item
        else
            defaults.push action


# handler for http
handler = (result, options) ->

    (req, res) ->
        
        response = new Response res, options

        new Request req, options, (request) ->
            context = { request, response }
            callbacks = []
            returned = no
            
            done = (name, args...) ->
                return if returned
                returned = yes
                name = 'blank' if not result[name]?

                for callback in callbacks by -1
                    callback.call context, name, args

                result[name].apply null, args
                    .call null, request, response
                response.respond() if not response.responded

            for pattern, def of routes
                [tester, functions] = def.get()
                params = {}
                index = -1

                # deny not matched
                continue if not tester request.method, request.path, params
                request.set params

                do next = (callback = null) ->
                    return if returned
                    
                    callbacks.push callback if callback?
                    index += 1
                    fn = if index >= defaults.length then functions[index - defaults.length] else defaults[index]
                    fn.call context, done, next if fn?

                return

            done 'notFound'


module.exports = { register, handler, use }

